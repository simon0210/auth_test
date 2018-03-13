FROM    node:6

COPY    package.json /src/package.json
RUN     cd /src; npm install
RUN     npm install pm2 -g
COPY    . /src

EXPOSE  3000

WORKDIR /src
CMD ["npm run compile"]

WORKDIR /src/build
CMD ["pm2-docker", "process.yml"]
