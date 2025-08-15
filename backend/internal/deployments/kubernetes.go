package deployments

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/archellir/denshimon/internal/k8s"
	"github.com/archellir/denshimon/internal/providers"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
)

// KubernetesDeployer handles deployment operations in Kubernetes
type KubernetesDeployer struct {
	k8sClient       *k8s.Client
	registryManager *providers.RegistryManager
}

// NewKubernetesDeployer creates a new Kubernetes deployer
func NewKubernetesDeployer(k8sClient *k8s.Client, registryManager *providers.RegistryManager) *KubernetesDeployer {
	return &KubernetesDeployer{
		k8sClient:       k8sClient,
		registryManager: registryManager,
	}
}

// Deploy creates a new deployment in Kubernetes
func (d *KubernetesDeployer) Deploy(ctx context.Context, deployment Deployment) (*appsv1.Deployment, error) {
	// Get registry provider for authentication
	registryProvider, err := d.registryManager.GetProvider(deployment.RegistryID)
	if err != nil {
		return nil, fmt.Errorf("failed to get registry provider: %w", err)
	}

	// Create image pull secret if needed
	secretName, err := d.createImagePullSecret(ctx, deployment.Namespace, deployment.RegistryID, registryProvider)
	if err != nil {
		return nil, fmt.Errorf("failed to create image pull secret: %w", err)
	}

	// Build Kubernetes deployment spec
	k8sDeployment := d.buildDeploymentSpec(deployment, secretName)

	// Create deployment
	clientset := d.k8sClient.Clientset()

	result, err := clientset.AppsV1().Deployments(deployment.Namespace).Create(ctx, k8sDeployment, metav1.CreateOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to create deployment: %w", err)
	}

	return result, nil
}

// Update updates an existing deployment in Kubernetes
func (d *KubernetesDeployer) Update(ctx context.Context, deployment Deployment) error {
	clientset := d.k8sClient.Clientset()

	// Get existing deployment
	existing, err := clientset.AppsV1().Deployments(deployment.Namespace).Get(ctx, deployment.Name, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("failed to get existing deployment: %w", err)
	}

	// Update the deployment spec
	existing.Spec.Replicas = &deployment.Replicas
	existing.Spec.Template.Spec.Containers[0].Image = deployment.Image

	// Update environment variables
	if deployment.Environment != nil {
		envVars := make([]corev1.EnvVar, 0, len(deployment.Environment))
		for key, value := range deployment.Environment {
			envVars = append(envVars, corev1.EnvVar{
				Name:  key,
				Value: value,
			})
		}
		existing.Spec.Template.Spec.Containers[0].Env = envVars
	}

	// Update resources
	if deployment.Resources.Limits.CPU != "" || deployment.Resources.Limits.Memory != "" ||
		deployment.Resources.Requests.CPU != "" || deployment.Resources.Requests.Memory != "" {

		resources := corev1.ResourceRequirements{}

		if deployment.Resources.Limits.CPU != "" || deployment.Resources.Limits.Memory != "" {
			resources.Limits = make(corev1.ResourceList)
			if deployment.Resources.Limits.CPU != "" {
				resources.Limits[corev1.ResourceCPU] = mustParseQuantity(deployment.Resources.Limits.CPU)
			}
			if deployment.Resources.Limits.Memory != "" {
				resources.Limits[corev1.ResourceMemory] = mustParseQuantity(deployment.Resources.Limits.Memory)
			}
		}

		if deployment.Resources.Requests.CPU != "" || deployment.Resources.Requests.Memory != "" {
			resources.Requests = make(corev1.ResourceList)
			if deployment.Resources.Requests.CPU != "" {
				resources.Requests[corev1.ResourceCPU] = mustParseQuantity(deployment.Resources.Requests.CPU)
			}
			if deployment.Resources.Requests.Memory != "" {
				resources.Requests[corev1.ResourceMemory] = mustParseQuantity(deployment.Resources.Requests.Memory)
			}
		}

		existing.Spec.Template.Spec.Containers[0].Resources = resources
	}

	// Apply the update
	_, err = clientset.AppsV1().Deployments(deployment.Namespace).Update(ctx, existing, metav1.UpdateOptions{})
	if err != nil {
		return fmt.Errorf("failed to update deployment: %w", err)
	}

	return nil
}

// Delete removes a deployment from Kubernetes
func (d *KubernetesDeployer) Delete(ctx context.Context, namespace, name string) error {
	clientset := d.k8sClient.Clientset()

	// Delete the deployment
	err := clientset.AppsV1().Deployments(namespace).Delete(ctx, name, metav1.DeleteOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete deployment: %w", err)
	}

	// Clean up associated image pull secret
	secretName := fmt.Sprintf("%s-registry-secret", name)
	clientset.CoreV1().Secrets(namespace).Delete(ctx, secretName, metav1.DeleteOptions{})

	return nil
}

// Restart triggers a restart of the deployment by updating an annotation
func (d *KubernetesDeployer) Restart(ctx context.Context, namespace, name string) error {
	clientset := d.k8sClient.Clientset()

	// Get existing deployment
	deployment, err := clientset.AppsV1().Deployments(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("failed to get deployment: %w", err)
	}

	// Add restart annotation to trigger rolling restart
	if deployment.Spec.Template.Annotations == nil {
		deployment.Spec.Template.Annotations = make(map[string]string)
	}
	deployment.Spec.Template.Annotations["kubectl.kubernetes.io/restartedAt"] = time.Now().Format(time.RFC3339)

	// Update the deployment
	_, err = clientset.AppsV1().Deployments(namespace).Update(ctx, deployment, metav1.UpdateOptions{})
	if err != nil {
		return fmt.Errorf("failed to restart deployment: %w", err)
	}

	return nil
}

// buildDeploymentSpec creates a Kubernetes deployment specification
func (d *KubernetesDeployer) buildDeploymentSpec(deployment Deployment, imagePullSecret string) *appsv1.Deployment {
	labels := map[string]string{
		"app":        deployment.Name,
		"managed-by": "denshimon",
	}

	// Build environment variables
	envVars := make([]corev1.EnvVar, 0, len(deployment.Environment))
	for key, value := range deployment.Environment {
		envVars = append(envVars, corev1.EnvVar{
			Name:  key,
			Value: value,
		})
	}

	// Build resource requirements
	resources := corev1.ResourceRequirements{}
	if deployment.Resources.Limits.CPU != "" || deployment.Resources.Limits.Memory != "" {
		resources.Limits = make(corev1.ResourceList)
		if deployment.Resources.Limits.CPU != "" {
			resources.Limits[corev1.ResourceCPU] = mustParseQuantity(deployment.Resources.Limits.CPU)
		}
		if deployment.Resources.Limits.Memory != "" {
			resources.Limits[corev1.ResourceMemory] = mustParseQuantity(deployment.Resources.Limits.Memory)
		}
	}
	if deployment.Resources.Requests.CPU != "" || deployment.Resources.Requests.Memory != "" {
		resources.Requests = make(corev1.ResourceList)
		if deployment.Resources.Requests.CPU != "" {
			resources.Requests[corev1.ResourceCPU] = mustParseQuantity(deployment.Resources.Requests.CPU)
		}
		if deployment.Resources.Requests.Memory != "" {
			resources.Requests[corev1.ResourceMemory] = mustParseQuantity(deployment.Resources.Requests.Memory)
		}
	}

	// Build deployment strategy
	deploymentStrategy := appsv1.DeploymentStrategy{
		Type: appsv1.RollingUpdateDeploymentStrategyType,
	}

	if deployment.Strategy.Type == "Recreate" {
		deploymentStrategy.Type = appsv1.RecreateDeploymentStrategyType
	} else {
		deploymentStrategy.RollingUpdate = &appsv1.RollingUpdateDeployment{
			MaxSurge:       &intstr.IntOrString{Type: intstr.Int, IntVal: deployment.Strategy.MaxSurge},
			MaxUnavailable: &intstr.IntOrString{Type: intstr.Int, IntVal: deployment.Strategy.MaxUnavailable},
		}
	}

	// Build pod spec
	podSpec := corev1.PodSpec{
		Containers: []corev1.Container{
			{
				Name:      deployment.Name,
				Image:     deployment.Image,
				Env:       envVars,
				Resources: resources,
			},
		},
		NodeSelector:  deployment.NodeSelector,
		RestartPolicy: corev1.RestartPolicyAlways,
	}

	// Add image pull secret if provided
	if imagePullSecret != "" {
		podSpec.ImagePullSecrets = []corev1.LocalObjectReference{
			{Name: imagePullSecret},
		}
	}

	// Add anti-affinity for node spreading
	if deployment.Strategy.NodeSpread {
		podSpec.Affinity = &corev1.Affinity{
			PodAntiAffinity: &corev1.PodAntiAffinity{
				PreferredDuringSchedulingIgnoredDuringExecution: []corev1.WeightedPodAffinityTerm{
					{
						Weight: 100,
						PodAffinityTerm: corev1.PodAffinityTerm{
							LabelSelector: &metav1.LabelSelector{
								MatchLabels: labels,
							},
							TopologyKey: "kubernetes.io/hostname",
						},
					},
				},
			},
		}
	}

	// Add topology spread constraints for zone spreading
	if deployment.Strategy.ZoneSpread {
		podSpec.TopologySpreadConstraints = []corev1.TopologySpreadConstraint{
			{
				MaxSkew:           1,
				TopologyKey:       "topology.kubernetes.io/zone",
				WhenUnsatisfiable: corev1.DoNotSchedule,
				LabelSelector: &metav1.LabelSelector{
					MatchLabels: labels,
				},
			},
		}
	}

	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      deployment.Name,
			Namespace: deployment.Namespace,
			Labels:    labels,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &deployment.Replicas,
			Strategy: deploymentStrategy,
			Selector: &metav1.LabelSelector{
				MatchLabels: labels,
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: labels,
				},
				Spec: podSpec,
			},
		},
	}
}

// createImagePullSecret creates a secret for registry authentication
func (d *KubernetesDeployer) createImagePullSecret(ctx context.Context, namespace, registryID string, provider providers.RegistryProvider) (string, error) {
	// Get auth config from provider
	authConfig, err := provider.GetAuthConfig()
	if err != nil {
		return "", err
	}

	// If no auth is needed, return empty string
	if authConfig == nil {
		return "", nil
	}

	clientset := d.k8sClient.Clientset()

	secretName := fmt.Sprintf("registry-%s", registryID)

	// Create docker config JSON
	dockerConfig := map[string]interface{}{
		"auths": map[string]interface{}{
			authConfig.ServerAddress: authConfig,
		},
	}

	dockerConfigJSON, err := json.Marshal(dockerConfig)
	if err != nil {
		return "", err
	}

	secret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      secretName,
			Namespace: namespace,
		},
		Type: corev1.SecretTypeDockerConfigJson,
		Data: map[string][]byte{
			".dockerconfigjson": dockerConfigJSON,
		},
	}

	// Create or update the secret
	_, err = clientset.CoreV1().Secrets(namespace).Create(ctx, secret, metav1.CreateOptions{})
	if err != nil {
		// If secret exists, update it
		_, updateErr := clientset.CoreV1().Secrets(namespace).Update(ctx, secret, metav1.UpdateOptions{})
		if updateErr != nil {
			return "", fmt.Errorf("failed to create/update secret: %w", updateErr)
		}
	}

	return secretName, nil
}

// KubernetesScaler handles scaling operations
type KubernetesScaler struct {
	k8sClient *k8s.Client
}

// NewKubernetesScaler creates a new Kubernetes scaler
func NewKubernetesScaler(k8sClient *k8s.Client) *KubernetesScaler {
	return &KubernetesScaler{
		k8sClient: k8sClient,
	}
}

// Scale changes the number of replicas for a deployment
func (s *KubernetesScaler) Scale(ctx context.Context, namespace, name string, replicas int32) error {
	clientset := s.k8sClient.Clientset()

	// Get the scale subresource
	scale, err := clientset.AppsV1().Deployments(namespace).GetScale(ctx, name, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("failed to get deployment scale: %w", err)
	}

	// Update replicas
	scale.Spec.Replicas = replicas

	// Apply the scale
	_, err = clientset.AppsV1().Deployments(namespace).UpdateScale(ctx, name, scale, metav1.UpdateOptions{})
	if err != nil {
		return fmt.Errorf("failed to update deployment scale: %w", err)
	}

	return nil
}

// Helper function to parse resource quantities
func mustParseQuantity(s string) resource.Quantity {
	q, err := resource.ParseQuantity(s)
	if err != nil {
		// Return zero quantity on error
		return resource.Quantity{}
	}
	return q
}
