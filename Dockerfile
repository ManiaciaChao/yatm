FROM node

ENV OPENID = ""

WORKDIR /home

COPY . .

RUN yarn

CMD yarn start ${OPENID}
