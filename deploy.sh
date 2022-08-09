docker build -t eu.gcr.io/remaid/rkurento-api:0.0.1 .
docker run --name rkapi -p 4040:4040 eu.gcr.io/remaid/rkurento-api:0.0.1
