# Build Stage
FROM node:17.3.0-buster as build

WORKDIR /opt/iex
COPY . /opt/iex

RUN npm set progress=false && npm set loglevel warn
RUN npm ci && \
  npm run bootstrap

RUN npm run build --prefix packages/convertbot && \
  npm run test --prefix packages/convertbot && \
  npm run prune:production && \
  npm prune --production

RUN find . -name ".npmrc" -type f -delete

# Production Stage
FROM node:17.3.0-buster

# Use testing to get the latest version of pandoc
# RUN echo 'deb http://http.us.debian.org/debian/ testing non-free contrib main' >> /etc/apt/sources.list
RUN apt-get update && apt-get install -y \
      nano \
      curl \
      fonts-dejavu-core \
      fonts-droid-fallback \
      fonts-freefont-ttf \
      fonts-liberation \
      fonts-noto-mono \
      git \
      ghostscript \
      libreoffice-common \
      libreoffice-writer \
      pandoc \
      python3-pip \
      texlive-latex-recommended \
      texlive-xetex \
      texlive-fonts-recommended \
      texlive-generic-recommended \
      unoconv \
  && rm -rf /var/lib/apt/lists/*

RUN pip3 install nbconvert

# Apply a custom ImageMagick policy
COPY ./packages/convertbot/resources/imagemagick-policy.xml /etc/ImageMagick-6/policy.xml

# Copy IEX code
WORKDIR /opt/iex
COPY --from=build /opt/iex .

EXPOSE 3010
CMD [ "npm", "run", "start:convertbot:prod" ]
