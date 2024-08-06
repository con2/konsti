FROM mcr.microsoft.com/playwright:v1.46.0-jammy

RUN apt-get install --no-install-recommends -y wget=1.21.2-2ubuntu1.1 \
  && wget -q -O /usr/local/bin/waitforit https://github.com/maxcnunes/waitforit/releases/download/v2.4.1/waitforit-linux_amd64 \
  && chmod +x /usr/local/bin/waitforit

WORKDIR /usr/src/app

COPY package.json ./
COPY tsconfig.json ./
COPY playwright ./playwright/
COPY shared ./shared/

RUN npm install --omit=dev --legacy-peer-deps \
  && npm install @playwright/test@1.46.0 --legacy-peer-deps
