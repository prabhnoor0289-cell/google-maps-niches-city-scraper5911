FROM apify/actor-node-playwright-chrome:22

COPY package*.json ./

RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional \
    && echo "Node.js version:" && node --version \
    && rm -r ~/.npm

COPY . ./

CMD npm start --silent
