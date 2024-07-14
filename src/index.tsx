import { Hono } from "hono";
import { renderer } from "./renderer";

const app = new Hono();
const emailBlocklistUrl =
  "https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf";
const emailAllowlistUrl =
  "https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/allowlist.conf";

const Result = (result: string) => {
  return (
    <div>
      <h1>Email Address Verification Result</h1>
      <div>{result}</div>
    </div>
  );
};

const Form = (input: string) => {
  return (
    <form action="">
      <input type="text" name="email" value={input} />
      <button type="submit">Check</button>
    </form>
  );
};

function validateEmail(email: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

async function verifyEmail(email: string) {
  const blocklist: string[] = [];
  try {
    const response = await fetch(emailBlocklistUrl);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const responseText = (await response.text()).split("\n");
    blocklist.push(...responseText);
  } catch (error: any) {
    console.error(`fetch error: ${error.message}`);
  }
  return blocklist.includes(email.split("@")[1]);
}

app.use(renderer);

app.get("/", async (c) => {
  const renderHtml = [];
  let email = c.req.query("email") || "";
  renderHtml.push(Form(email));
  if (!validateEmail(email)) {
    email = `Invalid Email Address: ${email}`;
    renderHtml.push(Result(email));
    return c.render(<>{renderHtml}</>);
  }
  const verifyResult = await verifyEmail(email);
  if (verifyResult) {
    renderHtml.push(Result(`Email Adress is in blocklist: ${email}`));
  } else {
    renderHtml.push(Result(`Email Adress is not in blocklist: ${email}`));
  }
  return c.render(<>{renderHtml}</>);
});

export default app;
