FROM mcr.microsoft.com/playwright:v1.42.1-jammy

RUN apt-get install --no-install-recommends -y wget=1.21.2-2ubuntu1 \
  && wget -q -O /usr/local/bin/waitforit https://github.com/maxcnunes/waitforit/releases/download/v2.4.1/waitforit-linux_amd64 \
  && chmod +x /usr/local/bin/waitforit

WORKDIR /usr/src/app

RUN npm install @playwright/test@1.42.1

COPY tsconfig.json ./
COPY playwright ./playwright/
COPY shared ./shared/
