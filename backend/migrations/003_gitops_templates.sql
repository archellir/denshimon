-- GitOps template customization tables
CREATE TABLE IF NOT EXISTS gitops_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- web-app, api-service, worker, cron-job, database, custom
    description TEXT,
    content TEXT NOT NULL, -- Template YAML content with variables
    variables TEXT, -- JSON array of required variables
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gitops_template_environments (
    id VARCHAR(255) PRIMARY KEY,
    template_id VARCHAR(255) NOT NULL,
    environment VARCHAR(50) NOT NULL, -- development, staging, production
    overrides TEXT NOT NULL, -- JSON overrides for the environment
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES gitops_templates(id) ON DELETE CASCADE,
    UNIQUE(template_id, environment)
);

-- Create indexes for templates
CREATE INDEX IF NOT EXISTS idx_gitops_templates_type ON gitops_templates(type);
CREATE INDEX IF NOT EXISTS idx_gitops_templates_is_default ON gitops_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_gitops_template_environments_template_id ON gitops_template_environments(template_id);
CREATE INDEX IF NOT EXISTS idx_gitops_template_environments_environment ON gitops_template_environments(environment);

-- Insert default templates
INSERT INTO gitops_templates (id, name, type, description, content, variables, is_default) VALUES
(
    'tpl-web-app',
    'Web Application',
    'web-app',
    'Standard web application with ingress and health checks',
    '---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{.Name}}
  namespace: {{.Namespace}}
  labels:
    app: {{.Name}}
    type: web-app
spec:
  replicas: {{.Replicas}}
  selector:
    matchLabels:
      app: {{.Name}}
  template:
    metadata:
      labels:
        app: {{.Name}}
    spec:
      containers:
      - name: {{.Name}}
        image: {{.Image}}
        ports:
        - containerPort: {{.Port}}
        resources:
          requests:
            cpu: {{.CPU.Request}}
            memory: {{.Memory.Request}}
          limits:
            cpu: {{.CPU.Limit}}
            memory: {{.Memory.Limit}}
        livenessProbe:
          httpGet:
            path: {{.HealthCheck.Path}}
            port: {{.Port}}
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: {{.HealthCheck.Path}}
            port: {{.Port}}
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        {{range $key, $value := .Environment}}
        - name: {{$key}}
          value: "{{$value}}"
        {{end}}
---
apiVersion: v1
kind: Service
metadata:
  name: {{.Name}}
  namespace: {{.Namespace}}
spec:
  selector:
    app: {{.Name}}
  ports:
  - port: {{.Port}}
    targetPort: {{.Port}}
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{.Name}}
  namespace: {{.Namespace}}
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  rules:
  - host: {{.Ingress.Host}}
    http:
      paths:
      - path: {{.Ingress.Path}}
        pathType: Prefix
        backend:
          service:
            name: {{.Name}}
            port:
              number: {{.Port}}',
    '[
        {"name": "Name", "required": true},
        {"name": "Namespace", "default": "default"},
        {"name": "Image", "required": true},
        {"name": "Replicas", "default": 1},
        {"name": "Port", "default": 8080},
        {"name": "CPU.Request", "default": "100m"},
        {"name": "CPU.Limit", "default": "500m"},
        {"name": "Memory.Request", "default": "128Mi"},
        {"name": "Memory.Limit", "default": "512Mi"},
        {"name": "HealthCheck.Path", "default": "/health"},
        {"name": "Ingress.Host", "required": true},
        {"name": "Ingress.Path", "default": "/"}
    ]',
    TRUE
),
(
    'tpl-api-service',
    'API Service',
    'api-service',
    'REST API service with rate limiting',
    '---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{.Name}}
  namespace: {{.Namespace}}
  labels:
    app: {{.Name}}
    type: api-service
spec:
  replicas: {{.Replicas}}
  selector:
    matchLabels:
      app: {{.Name}}
  template:
    metadata:
      labels:
        app: {{.Name}}
    spec:
      containers:
      - name: {{.Name}}
        image: {{.Image}}
        ports:
        - containerPort: {{.Port}}
        resources:
          requests:
            cpu: {{.CPU.Request}}
            memory: {{.Memory.Request}}
          limits:
            cpu: {{.CPU.Limit}}
            memory: {{.Memory.Limit}}
        livenessProbe:
          httpGet:
            path: /health
            port: {{.Port}}
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: {{.Port}}
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        {{range $key, $value := .Environment}}
        - name: {{$key}}
          value: "{{$value}}"
        {{end}}
---
apiVersion: v1
kind: Service
metadata:
  name: {{.Name}}
  namespace: {{.Namespace}}
spec:
  selector:
    app: {{.Name}}
  ports:
  - port: {{.Port}}
    targetPort: {{.Port}}
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{.Name}}
  namespace: {{.Namespace}}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{.Name}}
  minReplicas: {{.Replicas}}
  maxReplicas: {{.MaxReplicas}}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70',
    '[
        {"name": "Name", "required": true},
        {"name": "Namespace", "default": "default"},
        {"name": "Image", "required": true},
        {"name": "Replicas", "default": 2},
        {"name": "MaxReplicas", "default": 10},
        {"name": "Port", "default": 8080},
        {"name": "CPU.Request", "default": "200m"},
        {"name": "CPU.Limit", "default": "1000m"},
        {"name": "Memory.Request", "default": "256Mi"},
        {"name": "Memory.Limit", "default": "1Gi"}
    ]',
    TRUE
),
(
    'tpl-worker',
    'Background Worker',
    'worker',
    'Background worker without external access',
    '---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{.Name}}
  namespace: {{.Namespace}}
  labels:
    app: {{.Name}}
    type: worker
spec:
  replicas: {{.Replicas}}
  selector:
    matchLabels:
      app: {{.Name}}
  template:
    metadata:
      labels:
        app: {{.Name}}
    spec:
      containers:
      - name: {{.Name}}
        image: {{.Image}}
        resources:
          requests:
            cpu: {{.CPU.Request}}
            memory: {{.Memory.Request}}
          limits:
            cpu: {{.CPU.Limit}}
            memory: {{.Memory.Limit}}
        env:
        {{range $key, $value := .Environment}}
        - name: {{$key}}
          value: "{{$value}}"
        {{end}}',
    '[
        {"name": "Name", "required": true},
        {"name": "Namespace", "default": "default"},
        {"name": "Image", "required": true},
        {"name": "Replicas", "default": 1},
        {"name": "CPU.Request", "default": "100m"},
        {"name": "CPU.Limit", "default": "500m"},
        {"name": "Memory.Request", "default": "256Mi"},
        {"name": "Memory.Limit", "default": "1Gi"}
    ]',
    TRUE
),
(
    'tpl-cron-job',
    'Cron Job',
    'cron-job',
    'Scheduled job that runs periodically',
    '---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: {{.Name}}
  namespace: {{.Namespace}}
  labels:
    app: {{.Name}}
    type: cron-job
spec:
  schedule: "{{.Schedule}}"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: {{.Name}}
            image: {{.Image}}
            resources:
              requests:
                cpu: {{.CPU.Request}}
                memory: {{.Memory.Request}}
              limits:
                cpu: {{.CPU.Limit}}
                memory: {{.Memory.Limit}}
            env:
            {{range $key, $value := .Environment}}
            - name: {{$key}}
              value: "{{$value}}"
            {{end}}
          restartPolicy: OnFailure',
    '[
        {"name": "Name", "required": true},
        {"name": "Namespace", "default": "default"},
        {"name": "Image", "required": true},
        {"name": "Schedule", "default": "0 * * * *", "description": "Cron schedule expression"},
        {"name": "CPU.Request", "default": "100m"},
        {"name": "CPU.Limit", "default": "500m"},
        {"name": "Memory.Request", "default": "128Mi"},
        {"name": "Memory.Limit", "default": "512Mi"}
    ]',
    TRUE
);

-- Insert environment overrides for default templates
INSERT INTO gitops_template_environments (id, template_id, environment, overrides) VALUES
-- Web app environments
('env-web-dev', 'tpl-web-app', 'development', '{"Replicas": 1, "CPU.Request": "50m", "CPU.Limit": "200m", "Memory.Request": "64Mi", "Memory.Limit": "256Mi"}'),
('env-web-staging', 'tpl-web-app', 'staging', '{"Replicas": 2, "CPU.Request": "100m", "CPU.Limit": "500m", "Memory.Request": "128Mi", "Memory.Limit": "512Mi"}'),
('env-web-prod', 'tpl-web-app', 'production', '{"Replicas": 3, "CPU.Request": "500m", "CPU.Limit": "2000m", "Memory.Request": "512Mi", "Memory.Limit": "2Gi"}'),
-- API service environments
('env-api-dev', 'tpl-api-service', 'development', '{"Replicas": 1, "MaxReplicas": 2, "CPU.Request": "100m", "CPU.Limit": "500m", "Memory.Request": "128Mi", "Memory.Limit": "512Mi"}'),
('env-api-staging', 'tpl-api-service', 'staging', '{"Replicas": 2, "MaxReplicas": 4, "CPU.Request": "200m", "CPU.Limit": "1000m", "Memory.Request": "256Mi", "Memory.Limit": "1Gi"}'),
('env-api-prod', 'tpl-api-service', 'production', '{"Replicas": 3, "MaxReplicas": 10, "CPU.Request": "500m", "CPU.Limit": "2000m", "Memory.Request": "1Gi", "Memory.Limit": "4Gi"}'),
-- Worker environments
('env-worker-dev', 'tpl-worker', 'development', '{"Replicas": 1, "CPU.Request": "50m", "CPU.Limit": "200m", "Memory.Request": "64Mi", "Memory.Limit": "256Mi"}'),
('env-worker-staging', 'tpl-worker', 'staging', '{"Replicas": 1, "CPU.Request": "100m", "CPU.Limit": "500m", "Memory.Request": "256Mi", "Memory.Limit": "1Gi"}'),
('env-worker-prod', 'tpl-worker', 'production', '{"Replicas": 2, "CPU.Request": "200m", "CPU.Limit": "1000m", "Memory.Request": "512Mi", "Memory.Limit": "2Gi"}');