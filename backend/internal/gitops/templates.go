// Package gitops provides manifest templating for Kubernetes resources.
// It generates YAML manifests for various Kubernetes resources based on application configurations.
package gitops

import (
	"fmt"
	"strings"
	"text/template"
)

// ManifestTemplate represents a Kubernetes manifest template
type ManifestTemplate struct {
	Kind     string
	Template string
}

// TemplateData contains data for manifest generation
type TemplateData struct {
	App         *Application
	Namespace   string
	Labels      map[string]string
	Annotations map[string]string
}

// deploymentTemplate generates a Kubernetes Deployment manifest
var deploymentTemplate = ManifestTemplate{
	Kind: "Deployment",
	Template: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{.App.Name}}
  namespace: {{.App.Namespace}}
  labels:
    app: {{.App.Name}}
    managed-by: denshimon
    {{- range $key, $value := .Labels}}
    {{$key}}: {{$value}}
    {{- end}}
  annotations:
    {{- range $key, $value := .Annotations}}
    {{$key}}: {{$value}}
    {{- end}}
spec:
  replicas: {{.App.Replicas}}
  selector:
    matchLabels:
      app: {{.App.Name}}
  template:
    metadata:
      labels:
        app: {{.App.Name}}
        {{- range $key, $value := .Labels}}
        {{$key}}: {{$value}}
        {{- end}}
    spec:
      containers:
      - name: {{.App.Name}}
        image: {{.App.Image}}
        ports:
        - containerPort: 8080
          protocol: TCP
        env:
        {{- range $key, $value := .App.Environment}}
        - name: {{$key}}
          value: "{{$value}}"
        {{- end}}
        {{- if .App.Resources}}
        resources:
          {{- if index .App.Resources "cpu"}}
          limits:
            cpu: {{index .App.Resources "cpu"}}
          {{- end}}
          {{- if index .App.Resources "memory"}}
            memory: {{index .App.Resources "memory"}}
          {{- end}}
          {{- if index .App.Resources "cpu_request"}}
          requests:
            cpu: {{index .App.Resources "cpu_request"}}
          {{- end}}
          {{- if index .App.Resources "memory_request"}}
            memory: {{index .App.Resources "memory_request"}}
          {{- end}}
        {{- end}}
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
      restartPolicy: Always
---`,
}

// serviceTemplate generates a Kubernetes Service manifest
var serviceTemplate = ManifestTemplate{
	Kind: "Service",
	Template: `apiVersion: v1
kind: Service
metadata:
  name: {{.App.Name}}
  namespace: {{.App.Namespace}}
  labels:
    app: {{.App.Name}}
    managed-by: denshimon
    {{- range $key, $value := .Labels}}
    {{$key}}: {{$value}}
    {{- end}}
spec:
  selector:
    app: {{.App.Name}}
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
    name: http
  type: ClusterIP
---`,
}

// ingressTemplate generates a Kubernetes Ingress manifest
var ingressTemplate = ManifestTemplate{
	Kind: "Ingress",
	Template: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{.App.Name}}
  namespace: {{.App.Namespace}}
  labels:
    app: {{.App.Name}}
    managed-by: denshimon
    {{- range $key, $value := .Labels}}
    {{$key}}: {{$value}}
    {{- end}}
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    {{- range $key, $value := .Annotations}}
    {{$key}}: {{$value}}
    {{- end}}
spec:
  rules:
  - host: {{.App.Name}}.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: {{.App.Name}}
            port:
              number: 80
---`,
}

// configMapTemplate generates a Kubernetes ConfigMap manifest
var configMapTemplate = ManifestTemplate{
	Kind: "ConfigMap",
	Template: `apiVersion: v1
kind: ConfigMap
metadata:
  name: {{.App.Name}}-config
  namespace: {{.App.Namespace}}
  labels:
    app: {{.App.Name}}
    managed-by: denshimon
    {{- range $key, $value := .Labels}}
    {{$key}}: {{$value}}
    {{- end}}
data:
  {{- range $key, $value := .App.Environment}}
  {{$key}}: "{{$value}}"
  {{- end}}
---`,
}

// hpaTemplate generates a Kubernetes HorizontalPodAutoscaler manifest
var hpaTemplate = ManifestTemplate{
	Kind: "HorizontalPodAutoscaler",
	Template: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{.App.Name}}
  namespace: {{.App.Namespace}}
  labels:
    app: {{.App.Name}}
    managed-by: denshimon
    {{- range $key, $value := .Labels}}
    {{$key}}: {{$value}}
    {{- end}}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{.App.Name}}
  minReplicas: {{.App.Replicas}}
  maxReplicas: {{if index .App.Resources "max_replicas"}}{{index .App.Resources "max_replicas"}}{{else}}{{.App.Replicas | mul 3}}{{end}}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
---`,
}

// GenerateManifest generates a Kubernetes manifest for the given application and resource type
func (s *Service) GenerateManifest(app *Application, resourceType string, options map[string]interface{}) (string, error) {
	data := &TemplateData{
		App:       app,
		Namespace: app.Namespace,
		Labels: map[string]string{
			"version": "v1.0.0",
			"tier":    "application",
		},
		Annotations: map[string]string{
			"deployment.kubernetes.io/revision": "1",
		},
	}

	// Add custom labels and annotations from options
	if labels, ok := options["labels"].(map[string]string); ok {
		for k, v := range labels {
			data.Labels[k] = v
		}
	}

	if annotations, ok := options["annotations"].(map[string]string); ok {
		for k, v := range annotations {
			data.Annotations[k] = v
		}
	}

	var tmpl *template.Template
	var err error

	switch resourceType {
	case "Deployment":
		tmpl, err = template.New("deployment").Parse(deploymentTemplate.Template)
	case "Service":
		tmpl, err = template.New("service").Parse(serviceTemplate.Template)
	case "Ingress":
		tmpl, err = template.New("ingress").Parse(ingressTemplate.Template)
	case "ConfigMap":
		tmpl, err = template.New("configmap").Parse(configMapTemplate.Template)
	case "HorizontalPodAutoscaler":
		tmpl, err = template.New("hpa").Parse(hpaTemplate.Template)
	default:
		return "", fmt.Errorf("unsupported resource type: %s", resourceType)
	}

	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	var buf strings.Builder
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.String(), nil
}

// GenerateFullManifest generates all necessary Kubernetes manifests for an application
func (s *Service) GenerateFullManifest(app *Application, options map[string]interface{}) (string, error) {
	var manifests []string

	// Generate deployment
	deployment, err := s.GenerateManifest(app, "Deployment", options)
	if err != nil {
		return "", fmt.Errorf("failed to generate deployment: %w", err)
	}
	manifests = append(manifests, deployment)

	// Generate service if needed
	if needsService, ok := options["service"].(bool); !ok || needsService {
		service, err := s.GenerateManifest(app, "Service", options)
		if err != nil {
			return "", fmt.Errorf("failed to generate service: %w", err)
		}
		manifests = append(manifests, service)
	}

	// Generate ingress if enabled
	if needsIngress, ok := options["ingress"].(bool); ok && needsIngress {
		ingress, err := s.GenerateManifest(app, "Ingress", options)
		if err != nil {
			return "", fmt.Errorf("failed to generate ingress: %w", err)
		}
		manifests = append(manifests, ingress)
	}

	// Generate configmap if environment variables exist
	if len(app.Environment) > 0 {
		configmap, err := s.GenerateManifest(app, "ConfigMap", options)
		if err != nil {
			return "", fmt.Errorf("failed to generate configmap: %w", err)
		}
		manifests = append(manifests, configmap)
	}

	// Generate HPA if autoscaling is enabled
	if needsHPA, ok := options["autoscaling"].(bool); ok && needsHPA {
		hpa, err := s.GenerateManifest(app, "HorizontalPodAutoscaler", options)
		if err != nil {
			return "", fmt.Errorf("failed to generate hpa: %w", err)
		}
		manifests = append(manifests, hpa)
	}

	return strings.Join(manifests, "\n"), nil
}

// ValidateManifest performs basic validation on generated manifests
func (s *Service) ValidateManifest(manifest string) error {
	if manifest == "" {
		return fmt.Errorf("manifest is empty")
	}

	// Basic YAML structure validation
	lines := strings.Split(manifest, "\n")
	hasApiVersion := false
	hasKind := false
	hasMetadata := false

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "apiVersion:") {
			hasApiVersion = true
		}
		if strings.HasPrefix(line, "kind:") {
			hasKind = true
		}
		if strings.HasPrefix(line, "metadata:") {
			hasMetadata = true
		}
	}

	if !hasApiVersion {
		return fmt.Errorf("manifest missing apiVersion field")
	}
	if !hasKind {
		return fmt.Errorf("manifest missing kind field")
	}
	if !hasMetadata {
		return fmt.Errorf("manifest missing metadata field")
	}

	return nil
}

// GetSupportedResourceTypes returns list of supported Kubernetes resource types
func (s *Service) GetSupportedResourceTypes() []string {
	return []string{
		"Deployment",
		"Service",
		"Ingress",
		"ConfigMap",
		"HorizontalPodAutoscaler",
	}
}