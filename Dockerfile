FROM node:20-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

COPY run.sh /run.sh
COPY scripts /usr/src/app/scripts

RUN chmod +x /run.sh
CMD ["/run.sh"]