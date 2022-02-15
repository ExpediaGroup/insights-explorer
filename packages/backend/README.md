# Insights Explorer Backend

TODO: Fill out

## Installation

```
npm install
```

## Configuration

[dotenv-flow](https://github.com/kerimdzhanov/dotenv-flow)

### Generating an Encryption Key

The environment variable `ENCRYPTION_KEY` contains a secret key compatible with TweetNaCl's secretbox.

To obtain a suitable key, run this:

```bash
npx ts-node -e "import { generateKey } from './src/shared/crypto'; console.log(generateKey());"
```
