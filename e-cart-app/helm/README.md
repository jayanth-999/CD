# ==================================
# E-Cart Helm Chart Guide
# ==================================

## What is This?

This is a **Helm Chart** - the production-grade way to deploy Kubernetes applications.

## Structure

```
helm/
├── Chart.yaml              # Chart metadata
├── values.yaml             # ALL configuration in ONE file
└── templates/              # Kubernetes manifests with variables
    ├── namespace.yaml
    ├── backend-deployment.yaml
    ├── backend-service.yaml
    ├── frontend-deployment.yaml
    └── frontend-service.yaml
```

## Key Concept: values.yaml

**ONE file controls EVERYTHING**:
```yaml
backend:
  replicaCount: 2  # ← Change this, affects deployment
  image:
    tag: v2.0      # ← Update version here
```

Templates use these values:
```yaml
# templates/backend-deployment.yaml
replicas: {{ .Values.backend.replicaCount }}
```

## How to Deploy

### Install (First Time)
```powershell
# Deploy entire application
helm install ecart ./helm

# Deploy to specific namespace
helm install ecart ./helm --namespace ecart --create-namespace
```

### Upgrade (Update)
```powershell
# Change values.yaml, then:
helm upgrade ecart ./helm

# Or override values from command line:
helm upgrade ecart ./helm --set backend.replicaCount=5
```

### Uninstall
```powershell
helm uninstall ecart
```

## Benefits Over Plain YAML

### 1. **Single Source of Truth**
- All config in `values.yaml`
- No scattered hardcoded values

### 2. **Environment-Specific Deployments**
```powershell
# Development
helm install ecart ./helm -f values-dev.yaml

# Production
helm install ecart ./helm -f values-prod.yaml
```

### 3. **Easy Rollbacks**
```powershell
# Rollback to previous version
helm rollback ecart

# View deployment history
helm history ecart
```

### 4. **Dry Run (Test Without Applying)**
```powershell
# See what will be created
helm install ecart ./helm --dry-run --debug
```

## Comparison

### Traditional Way (What We Did)
```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/backend/deployment.yaml
kubectl apply -f k8s/backend/service.yaml
# ... 10 more files

# To change replica count:
# Edit deployment.yaml manually
# kubectl apply -f k8s/backend/deployment.yaml
```

### Helm Way (Production)
```powershell
helm install ecart ./helm

# To change replica count:
# Edit values.yaml: backend.replicaCount: 5
helm upgrade ecart ./helm
```

## Real-World Usage

### Scenario: Deploy to Different Environments

**values-dev.yaml**:
```yaml
backend:
  replicaCount: 1
  resources:
    limits:
      memory: "128Mi"
```

**values-prod.yaml**:
```yaml
backend:
  replicaCount: 10
  resources:
    limits:
      memory: "2Gi"
```

**Deploy**:
```powershell
# Development
helm install ecart-dev ./helm -f values-dev.yaml

# Production
helm install ecart-prod ./helm -f values-prod.yaml
```

## Interview Gold! 🌟

**Q: How do you manage Kubernetes deployments at scale?**

**Your Answer**: 
> "We use Helm charts with a centralized values.yaml file. This allows us to manage all configuration from a single source of truth. We have environment-specific value files (dev, staging, prod) and use Helm's templating engine to generate Kubernetes manifests. This makes it easy to version, rollback, and deploy to multiple environments consistently."

## Next Steps

1. ✅ Created complete Helm chart structure
2. Try deploying: `helm install ecart ./helm`
3. Modify `values.yaml` and upgrade: `helm upgrade ecart ./helm`
4. Create `values-prod.yaml` for production config
