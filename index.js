const express = require("express");
require("dotenv").config();
const Mailchain = require("@mailchain/sdk").Mailchain;
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");
// import { Mailchain } from "@mailchain/sdk";

const app = express();
app.use(express.json());
// app.use(cors());

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

//OPEN AI CONFIG
const configuration = new Configuration({
  organization: process.env.ORG_ID,
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

//MAILCHAIN RECOVERY PHRASE
const secretRecoveryPhrase =
  "imitate increase ritual oil draft cross recycle alien clip double owner gown feed trend bone quarter nice fit theme reason found limit hood waste";
const mailchain = Mailchain.fromSecretRecoveryPhrase(secretRecoveryPhrase);

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
  // from: `sifat33@mailchain.com`,
  // to: [`0x2F1d7Eb39779373A85d49C1293d92c3ECA465f6F@ethereum.mailchain.com`],

  const user = await mailchain.user();
  console.log(user.address);

  const emailMessage = await gptResponse(req.body.message);

  const { data, error } = await mailchain.sendMail({
    from: `sifat33@mailchain.com`, // sender address
    to: [`${req.body.email}@ethereum.mailchain.com`], // list of recipients (blockchain or mailchain addresses)
    subject: req.body.name, // subject line
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
