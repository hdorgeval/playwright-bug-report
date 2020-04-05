# playwright-bug-report
repo that reproduces what seems to be a regression.

The error is : `_failureText:"net::ERR_FAILED` and the response object is null.

## how to use:

- clone the repo
- npm i

## to run the test

```sh
npm test
```

## to debug the test in VSCode

Open the test file and press F5.

If you change the Playwright version back to v0.11.1, the test passes.
