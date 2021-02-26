# Git notes

[git commands](https://www.hostinger.com/tutorials/basic-git-commands)

[creating a new branch](https://stackabuse.com/git-create-a-new-branch/)

# My walkthrough
* clone the repository:
```git
git clone https://github.com/Swagger-UI-Alternatives/redoc
```
* if you want to make a new branch:
```git
git checkout -b name-of-branch
```

# Redoc Development Setup and NPM script

First:

mac (if you have homebrew):
brew install node

windows:
* Click the link below and install node through their website 
https://nodejs.org/en/download/


To make sure they're downloaded
```npm
node -v
npm -v
```
* We need npm in order to run redoc from our local computers. npm is the node package manager that we will be running redoc (and other react projects) with.
* npm install looks at the package.json dependencies and it installs anything inside of that.
* very useful because you don't want to download a ton of boiler-plate files from github when you just want the meat of the github project that you will be modifying.

[What I'm following](https://github.com/Redocly/redoc/blob/master/.github/CONTRIBUTING.md)
* the directory you should be in is the root redoc folder
0. 
    ```npm
    npm install
    ```

1. dev-server, watch and auto reload playground
    ```npm
    npm start
    ```
    * localhost:9090 instead of the typical localhost:5000
    * This server stays on. Makes sense since its for development, auto reloading playground
    * How do I terminate the hosting then? ctrl^C or if need be
    ```npm
    killall node
    ```
2. There are other scripts in the main directory in the package.json file



