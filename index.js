const inquirer = require("inquirer");
const electron = require("electron");
const convertFactory = require('electron-html-to');
const axios = require("axios");
const util = require("util");
const fs = require('fs');
const generateHTML = require("./generateHTML");

const writeFileAsync = util.promisify(fs.writeFile);
const readFileAsync = util.promisify(fs.readFile);

function promptUser() {
  return inquirer.prompt([
    {
      type: "input",
      name: "github",
      message: "What is your GitHub username?"
    },
    {
      type: "list",
      name: "color",
      message: "Pick a color for your profile PDF.",
      choices: ['green', 'blue', 'pink', 'red']
    }
  ]);
}

promptUser()
  .then((data) => {
    const queryURL = `https://api.github.com/users/${data.github}`;
    const starsURL = `https://api.github.com/users/${data.github}/starred`;

    axios.get(queryURL).then((res) => {
      axios.get(starsURL).then((stars) => {

        html = generateHTML(data, res, stars);
        writeFileAsync("profile.html", html);

      }).then(() => {
        readFileAsync("profile.html", "utf8").then((htmlDoc) => {

          const conversion = convertFactory({
            converterPath: convertFactory.converters.PDF,
            allowLocalFilesAccess: true
          });

          conversion({ html: htmlDoc }, function (err, result) {
            if (err) {
              return console.error(err);
            }

            result.stream.pipe(fs.createWriteStream('Profile.pdf'));
            conversion.kill();
          });

        })

      })
    })
  })

  .catch(function (err) {
    console.log(err);
  });