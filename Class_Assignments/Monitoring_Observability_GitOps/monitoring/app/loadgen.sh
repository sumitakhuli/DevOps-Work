#!/bin/sh
# Steady mixed traffic against the shop API.
while true; do
  curl -s -o /dev/null http://shop-api:8000/api/products
  curl -s -o /dev/null -X POST http://shop-api:8000/api/checkout
  curl -s -o /dev/null http://shop-api:8000/api/report
  sleep 0.2
done
