# E-Cart Kubernetes Deployment - Complete Walkthrough
## Successfully Deployed to Kind Cluster

**Date**: December 26, 2025  
**Cluster**: Kind (dev-cluster)  
**Namespace**: ecart

---

## 🎉 Deployment Summary

### Final Status: SUCCESS ✅

```
NAME                        READY   STATUS    
deployment.apps/backend     2/2     Running   ✅
deployment.apps/frontend    1/1     Running   ✅
deployment.apps/postgres    1/1     Running   ✅
deployment.apps/zookeeper   1/1     Running   ✅
deployment.apps/kafka       1/1     Running   ✅
```

**Access Application**: http://localhost:30007

---

## 📋 What Was Deployed

### Application Components

| Component | Type | Replicas | Status | Port | Service Type |
|-----------|------|----------|--------|------|--------------|
| **Frontend** | Deployment | 1 | Running | 80 | NodePort (30007) |
| **Backend** | Deployment | 2 | Running | 3000 | ClusterIP |
| **Postgres** | Deployment | 1 | Running | 5432 | ClusterIP |
| **Kafka** | Deployment | 1 | Running | 9092 | ClusterIP |
| **Zookeeper** | Deployment | 1 | Running | 2181 | ClusterIP |

### DNS Names (Service Discovery)

```
frontend   → frontend.ecart.svc.cluster.local
backend    → backend.ecart.svc.cluster.local
postgres   → postgres.ecart.svc.cluster.local
kafka      → kafka.ecart.svc.cluster.local
zookeeper  → zookeeper.ecart.svc.cluster.local
```

---

## 🚀 Deployment Journey

### Step 1: Created Namespace

```powershell
kubectl apply -f .\k8s\namespace.yml
```

**Result**: Created `ecart` namespace for isolation

---

### Step 2: Initial Deployment Attempt - Failed

```powershell
kubectl apply -f .\k8s\infrastructure\
```

**Error**: 
```
Error: namespaces "ecart" not found
```

**Root Cause**: Deployments didn't have `namespace: ecart` in metadata

**Lesson Learned**: BOTH Service AND Deployment need `namespace:` field!

---

### Step 3: Fixed Namespace Configuration

Added `namespace: ecart` to ALL files:

**Updated Files**:
- `k8s/backend/deployment.yaml` ✅
- `k8s/backend/service.yaml` ✅
- `k8s/frontend/deployment.yaml` ✅
- `k8s/frontend/service.yaml` ✅
- `k8s/infrastructure/postgres.yaml` ✅
- `k8s/infrastructure/kafka.yaml` ✅
- `k8s/infrastructure/zookeeper.yaml` ✅

**Example Fix**:
```yaml
# Before
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend

# After
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: ecart  # ← Added
```

---

### Step 4: Deployed Infrastructure

```powershell
kubectl apply -f .\k8s\infrastructure\
```

**Result**: 
- ✅ Postgres: Running
- ✅ Zookeeper: Running
- ❌ Kafka: CrashLoopBackOff (couldn't find zookeeper)

**Why Kafka failed initially**: Old Kafka pods were in `default` namespace trying to connect to Zookeeper service in `ecart` namespace

**Fix**: Deleted old deployments, redeployed to correct namespace

---

### Step 5: Deployed Backend - Image Error

```powershell
kubectl apply -f .\k8s\backend\
```

**Error**:
```
pod/backend-xxx   0/1   ErrImageNeverPull
```

**Root Cause**: 
- Deployment has `imagePullPolicy: Never`
- Images exist on host but NOT inside Kind cluster
- Kind cluster can't see Docker Desktop images!

---

### Step 6: Fixed livenessProbe Indentation

**Error**:
```
unknown field "spec.template.spec.livenessProbe"
```

**Issue**: `livenessProbe` was at wrong indentation level

**Wrong**:
```yaml
spec:
  containers:
  - name: backend
    env:
    - name: KAFKA_BROKER
      value: "kafka:9092"

  livenessProbe:  # ← Wrong level!
    httpGet:
      path: /health
```

**Correct**:
```yaml
spec:
  containers:
  - name: backend
    env:
    - name: KAFKA_BROKER
      value: "kafka:9092"
    livenessProbe:  # ← Inside container definition
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
```

---

### Step 7: Loaded Images into Kind Cluster

**Commands**:
```powershell
# Check Kind cluster name
kind get clusters
# Output: dev-cluster

# Load backend image
kind load docker-image e-cart-app-backend:latest --name dev-cluster

# Load frontend image
kind load docker-image e-cart-app-frontend:latest --name dev-cluster
```

**What this does**: Transfers images from Docker Desktop into Kind cluster's container registry

---

### Step 8: Restarted Deployments

```powershell
kubectl rollout restart deployment/backend -n ecart
kubectl rollout restart deployment/frontend -n ecart
kubectl rollout restart deployment/kafka -n ecart
```

**Result**: All pods started successfully! 🎉

---

### Step 9: Fixed Frontend Namespace Selector Error

**Error**:
```
selector does not match template labels
```

**Issue**: `namespace: ecart` was in `matchLabels` instead of `metadata`

**Wrong**:
```yaml
spec:
  selector:
    matchLabels:
      app: frontend
      namespace: ecart  # ← Wrong place!
```

**Correct**:
```yaml
metadata:
  name: frontend
  namespace: ecart  # ← Correct place!
spec:
  selector:
    matchLabels:
      app: frontend  # ← Only app label
```

---

## 🔍 Final Verification

### Check All Resources

```powershell
kubectl get all -n ecart
```

**Output**:
```
NAME                          READY   STATUS    
pod/backend-76b4b8bd56-xxx    1/1     Running
pod/backend-76b4b8bd56-yyy    1/1     Running
pod/frontend-57f44bb747-xxx   1/1     Running
pod/postgres-7df46d6d98-xxx   1/1     Running
pod/zookeeper-74cb8fb967-xxx  1/1     Running
pod/kafka-89df64dc8-xxx       1/1     Running

NAME                TYPE        CLUSTER-IP      PORT(S)
service/backend     ClusterIP   10.96.218.203   3000/TCP
service/frontend    NodePort    10.96.253.95    80:30007/TCP
service/postgres    ClusterIP   10.96.168.19    5432/TCP
service/kafka       ClusterIP   10.96.128.50    9092/TCP
service/zookeeper   ClusterIP   10.96.163.70    2181/TCP
```

### Test Connectivity

```powershell
# Check backend can reach postgres
kubectl exec -n ecart deployment/backend -- nc -zv postgres 5432

# Check backend can reach kafka
kubectl exec -n ecart deployment/backend -- nc -zv kafka 9092

# Access frontend
http://localhost:30007
```

---

## 📚 Key Lessons Learned

### 1. Namespace Configuration

**Critical**: Add `namespace:` to BOTH Service and Deployment metadata

```yaml
# Both need namespace!
apiVersion: v1
kind: Service
metadata:
  namespace: ecart  # ← Required

---
apiVersion: apps/v1
kind: Deployment
metadata:
  namespace: ecart  # ← Also required!
```

### 2. Kind Cluster Image Management

**Problem**: `imagePullPolicy: Never` looks for images INSIDE cluster

**Solutions**:
- **Option A**: Load images with `kind load docker-image`
- **Option B**: Use a registry and change `imagePullPolicy: Always`
- **Option C**: Use Docker Desktop's Kubernetes (shares images automatically)

### 3. YAML Indentation Matters

**Health probes must be at container level**:
```yaml
containers:
- name: backend
  ports:
  - containerPort: 3000
  livenessProbe:  # ← Same level as ports, env, image
    httpGet:
      path: /health
```

### 4. Label Selectors vs Metadata

**Namespace goes in metadata, NOT in labels**:
```yaml
metadata:
  name: frontend
  namespace: ecart  # ← Here

spec:
  selector:
    matchLabels:
      app: frontend  # ← Not here!
```

### 5. Service Discovery Within Namespace

Services can reach each other using simple names:
```yaml
env:
- name: DB_HOST
  value: "postgres"  # Works! (same namespace)
- name: KAFKA_BROKER
  value: "kafka:9092"  # Works!
```

---

## 🛠️ Troubleshooting Commands Used

```powershell
# View pod status
kubectl get pods -n ecart

# Watch pods in real-time
kubectl get pods -n ecart -w

# View logs
kubectl logs -n ecart <pod-name>
kubectl logs -n ecart deployment/backend

# Describe for detailed events
kubectl describe pod -n ecart <pod-name>

# Check service endpoints
kubectl get endpoints -n ecart

# Exec into pod
kubectl exec -it -n ecart <pod-name> -- sh

# Restart deployment
kubectl rollout restart deployment/<name> -n ecart

# Delete and recreate
kubectl delete deployment <name> -n ecart
kubectl apply -f <file>
```

---

## 📊 Resource Usage

```powershell
kubectl top pods -n ecart
kubectl top nodes
```

**Backend Pods**:
- Replicas: 2
- No resource limits set (should add for production!)

**Recommended limits**:
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

---

## 🔐 Security Improvements Needed

1. **Secrets**: Postgres password in plain text!
   ```yaml
   # Create secret
   kubectl create secret generic db-secret \
     --from-literal=password=password \
     -n ecart
   
   # Use in deployment
   env:
   - name: POSTGRES_PASSWORD
     valueFrom:
       secretKeyRef:
         name: db-secret
         key: password
   ```

2. **Health Checks**: Add readiness probes
3. **Resource Limits**: Prevent resource hogging
4. **Network Policies**: Restrict pod-to-pod communication

---

## 🎯 Production Readiness Checklist

- [x] All pods running in dedicated namespace
- [x] Services configured with correct selectors
- [x] Liveness probes added to backend
- [ ] Readiness probes (add)
- [ ] Resource requests/limits (add)
- [ ] Secrets for passwords (add)
- [ ] Persistent volumes for Postgres (add)
- [ ] Horizontal Pod Autoscaler (add)
- [ ] Network policies (add)
- [ ] Ingress for external access (add)
- [ ] Monitoring (Prometheus/Grafana)
- [ ] Logging (ELK/Loki)

---

## 🚀 Next Steps

### Immediate (This Session)
1. Add frontend environment variable: `REACT_APP_API_URL=http://backend:3000`
2. Test frontend → backend connectivity
3. Verify end-to-end application flow

### Short Term
1. Add resource limits to all pods
2. Convert passwords to Secrets
3. Add readiness probes
4. Set up Persistent Volumes for Postgres

### Long Term
1. Implement HPA for auto-scaling
2. Add Ingress controller
3. Set up monitoring with Prometheus
4. Configure CI/CD pipeline

---

## 📝 Final Deployment Commands

```powershell
# Complete deployment from scratch
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/infrastructure/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/

# Load images (Kind only)
kind load docker-image e-cart-app-backend:latest --name dev-cluster
kind load docker-image e-cart-app-frontend:latest --name dev-cluster

# Restart to pull images
kubectl rollout restart deployment/backend -n ecart
kubectl rollout restart deployment/frontend -n ecart

# Verify
kubectl get all -n ecart

# Access
http://localhost:30007
```

---

**Congratulations! You've successfully deployed a multi-tier application to Kubernetes!** 🎉

This deployment demonstrates:
✅ Namespace isolation  
✅ Service discovery (DNS)  
✅ Multi-pod deployments  
✅ External access (NodePort)  
✅ Health checks  
✅ Real-world troubleshooting  

**Interview-ready skills acquired!** 💪
