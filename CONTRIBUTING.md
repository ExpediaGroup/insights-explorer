# Contributing

We'd love to accept your patches and contributions to this project. There are just a few guidelines you need to follow which are described in detail below.

For major changes, please open an issue first to discuss what you would like to change.

## 1. Fork this repo

You should create a fork of this project in your account and work from there. You can create a fork by clicking the fork button in GitHub.

## 2. One feature, one branch

Work for each new feature/issue should occur in its own branch. To create a new branch from the command line:
```shell
git checkout -b my-new-feature
```
where "my-new-feature" describes what you're working on.

## 3. Add unit tests
If your contribution modifies existing or adds new code please add corresponding unit tests for this.

## 4. Ensure that the build passes

Run
```shell
npm run build && npm run test
```
and check that there are no errors.

## 5. Add documentation for new or updated functionality

Please review all of the .md files in this project to see if they are impacted by your change and update them accordingly.

## 6. Use Conventional Commits

This repository adheres to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), so please follow the spec when creating commits.

The commit message will be automatically pulled into the `CHANGELOG.md`, so please take care to correctly describe your change.

There are plenty of existing commits to serve as examples.

## 7. Submit a pull request and describe the change

Push your changes to your branch and open a pull request against the parent repo on GitHub. The project administrators will review your pull request and respond with feedback.

# How your contribution gets merged

Upon pull request submission, your code will be automatically built, subjected to automated checks, and reviewed by the maintainers. They will confirm at least the following:

- The build runs successfully
- Contribution policy has been followed.

Two (human) reviewers will need to sign off on your pull request before it can be merged.
