FROM node:24-bookworm-slim
ARG ENGSTIEN_VERSION=0.2.0
WORKDIR /app
# The frontend is already compiled and tested by GitHub. Green only assembles
# the small runtime image; no npm install or frontend build runs on the hub.
ADD https://github.com/emilaet/Engstien25/releases/download/green-v${ENGSTIEN_VERSION}/engstien-${ENGSTIEN_VERSION}.tar.gz /tmp/engstien.tar.gz
ADD https://github.com/emilaet/Engstien25/releases/download/green-v${ENGSTIEN_VERSION}/engstien-${ENGSTIEN_VERSION}.sha256 /tmp/engstien.sha256
RUN node -e "const fs=require('fs'),c=require('crypto'),expected=fs.readFileSync('/tmp/engstien.sha256','utf8').trim().split(/\s/)[0],actual=c.createHash('sha256').update(fs.readFileSync('/tmp/engstien.tar.gz')).digest('hex');if(!/^[a-f0-9]{64}$/.test(expected)||actual!==expected)throw Error('Invalid release checksum')" \
 && tar -xzf /tmp/engstien.tar.gz -C /app \
 && rm /tmp/engstien.tar.gz /tmp/engstien.sha256
ENV NODE_ENV=production
LABEL io.hass.name="Engstien 25" io.hass.description="Hjem og rum" io.hass.type="addon" io.hass.version=${ENGSTIEN_VERSION} org.opencontainers.image.source="https://github.com/emilaet/Engstien25"
EXPOSE 8099
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD ["node","-e","fetch('http://127.0.0.1:8099/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["node","server/addon.mjs"]
