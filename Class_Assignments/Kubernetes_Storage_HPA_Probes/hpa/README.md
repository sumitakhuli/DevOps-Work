# HPA hands-on — manifests

The run, its output and screenshots are in the [main README](../README.md#task-2-hpa-hands-on).

| File | What it is |
|---|---|
| [`deployment.yml`](deployment.yml) | `php-apache` (`registry.k8s.io/hpa-example`), a page that burns CPU on every request. `requests.cpu: 100m` — HPA percentages are relative to this |
| [`service.yml`](service.yml) | ClusterIP Service `php-apache` so the load generator has a stable name |
| [`hpa.yml`](hpa.yml) | `autoscaling/v2` HPA: 1–5 replicas, target 50% average CPU |
| [`load-generator.yml`](load-generator.yml) | busybox Pod running `while true; do wget -q -O- http://php-apache; done` |

```bash
minikube addons enable metrics-server
kubectl apply -f deployment.yml -f service.yml -f hpa.yml
kubectl apply -f load-generator.yml        # start load
kubectl get hpa php-apache -w              # watch it scale
kubectl delete pod load-generator          # stop load; scale-down follows after ~5 minutes
kubectl delete -f .
```
