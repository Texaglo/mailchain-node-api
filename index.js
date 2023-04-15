const express = require("express");
require("dotenv").config();
const Mailchain = require("@mailchain/sdk").Mailchain;
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");
const schedule = require("node-schedule");
// import { Mailchain } from "@mailchain/sdk";

const app = express();
app.use(express.json());
app.use(cors());

// app.use(
//   cors({
//     origin: "*",
//     methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//     preflightContinue: false,
//     optionsSuccessStatus: 204,
//   })
// );

//OPEN AI CONFIG
const configuration = new Configuration({
  organization: process.env.ORG_ID,
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

//MAILCHAIN RECOVERY PHRASE
const secretRecoveryPhrase = process.env.RECOVERY_PHRASE;
const mailchain = Mailchain.fromSecretRecoveryPhrase(secretRecoveryPhrase);

const dataList = [
  {
    name: "sifat",
    age: "100",
    time: "2023-04-14T22:43",
  },
  {
    name: "rifat",
    age: "200",
    time: "2023-04-14T22:44",
  },
];

const gptResponse = async (message) => {
  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: message,
      max_tokens: 2048,
      temperature: 1,
    });
    return response.data.choices[0].text;
  } catch (error) {
    console.log(error);
  }
};

const senMail = async (req, res) => {
  const user = await mailchain.user();
  console.log(user.address);

  req.body.forEach(async (element, index) => {
    console.log(element);

    const job = schedule.scheduleJob(element.getTime, async () => {
      console.log("The world is going to end today.");

      const emailMessage = await gptResponse(element.message);

      const { data, error } = await mailchain.sendMail({
        from: user.address, // sender address
        to: [`${element.toEmail}@ethereum.mailchain.com`], // list of recipients (blockchain or mailchain addresses)
        subject: element.name, // subject line
        content: {
          text: emailMessage, // plain text body
          html: `<p>${emailMessage}</p>`, // html body
        },
      });
      if (error) {
        // handle error
        console.warn("Mailchain error", error);
        return;
      }
      // handle success send mail result
      console.log(data);
    });
  });

  // from: user.address, // sender address
  //       to: [`${req.body.email}@ethereum.mailchain.com`], // list of recipients (blockchain or mailchain addresses)
  //       subject: req.body.name, // subject line
  //       content: {
  //         text: emailMessage, // plain text body
  //         html: `<p>${emailMessage}</p>`, // html body
  //       },

  res.send({
    Response_code: 200,
    Response_message: "success",
    Response_data: req.body.name,
    // Response_data: data,
  });
};

// =================================================
app.post("/sendMail", async (req, res) => {
  senMail(req, res);
});

app.post("/test", async (req, res) => {
  res.send({
    Response_code: 200,
    Response_message: "success",
    // Response_data: data,
  });
});

const port = 4000;

app.listen(port, () => {
  console.log(`app runingn on port ${port}......`);
});
