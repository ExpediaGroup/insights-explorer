# Build Stage
FROM node:18.2.0-buster as build

WORKDIR /opt/iex
COPY . /opt/iex

RUN npm set progress=false && npm set loglevel warn
RUN npm ci

RUN npm run build --prefix packages/convertbot && \
  npm run test --prefix packages/convertbot && \
  npm run prune:production && \
  npm prune --production

RUN find . -name ".npmrc" -type f -delete

# Production Stage
FROM node:18.2.0-buster

# Use testing to get the latest version of pandoc
# RUN echo 'deb http://http.us.debian.org/debian/ testing non-free contrib main' >> /etc/apt/sources.list
RUN apt-get update && apt-get install -y \
      nano \
      curl \
      git \
      ghostscript \
      libreoffice-common \
      libreoffice-writer \
      pandoc \
      python3-pip \
      texlive-latex-recommended \
      texlive-xetex \
      texlive-generic-recommended \
      unoconv

# Fonts
RUN apt-get update && apt-get install -y \
      fonts-crosextra-caladea \
      fonts-crosextra-carlito \
      fonts-dejavu-core \
      fonts-droid-fallback \
      fonts-ebgaramond \
      fonts-firacode \
      fonts-freefont-ttf \
      fonts-inconsolata \
      fonts-liberation2 \
      fonts-noto-mono \
      fonts-open-sans \
      fonts-roboto \
      texlive-fonts-recommended

RUN rm -rf /var/lib/apt/lists/*

RUN pip3 install nbconvert

# Apply a custom ImageMagick policy
COPY ./packages/convertbot/resources/imagemagick-policy.xml /etc/ImageMagick-6/policy.xml

# Copy IEX code
WORKDIR /opt/iex
COPY --from=build /opt/iex .

EXPOSE 3010
CMD [ "npm", "run", "start:convertbot:prod" ]
