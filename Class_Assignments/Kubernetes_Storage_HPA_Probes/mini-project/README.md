# Mini project — manifests

A web app that combines persistent storage, autoscaling and health probes. The run, output and
screenshots are in the [main README](../README.md#task-3-mini-project).

| File | What it is |
|---|---|
| [`namespace.yaml`](namespace.yaml) | `production-webapp` |
| [`pvc.yaml`](pvc.yaml) | `web-data`, 500Mi RWO, dynamically provisioned by `standard` |
| [`deployment.yaml`](deployment.yaml) | `web-app`, 2× nginx, PVC at `/data`, CPU/memory requests and limits, startup + readiness + liveness probes |
| [`service.yaml`](service.yaml) | ClusterIP `web-service` |
| [`hpa.yaml`](hpa.yaml) | `web-app-hpa`, 2–5 replicas at 50% CPU |
| [`load-generator.yaml`](load-generator.yaml) | optional busybox load for `web-service` |

```bash
kubectl apply -f namespace.yaml -f pvc.yaml -f deployment.yaml -f service.yaml -f hpa.yaml
kubectl get pvc,deploy,pods,svc,hpa -n production-webapp
kubectl delete namespace production-webapp
```

The Deployment uses `strategy: Recreate`: the claim is `ReadWriteOnce`, which on a multi-node
cluster can only be mounted by Pods on one node, so old Pods are stopped before new ones start.
