# Kubernetes

Kubernetes manifests are kept here.

## Deploy

```powershell
kubectl apply -f kubernetes/
kubectl get pods
kubectl get services
```

The CI/CD workflow also contains an optional automated deployment job.
Set the GitHub repository variable `ENABLE_K8S_DEPLOY` to `true` and add
the base64-encoded Kubernetes configuration as the `KUBE_CONFIG_DATA` secret.

The workflow applies the manifests, updates the deployments to the version
stored in `VERSION`, and waits for all deployments to become ready.
