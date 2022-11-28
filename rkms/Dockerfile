FROM kurento/kurento-media-server:6.18.0

# Copy configuration files
COPY config/kurento.conf.json /etc/kurento/kurento.conf.json
COPY config/WebRtcEndpoint.conf.ini /etc/kurento/modules/kurento/WebRtcEndpoint.conf.ini
# Copy TLS certificate
COPY config/cert+key.pem /etc/kurento/cert+key.pem