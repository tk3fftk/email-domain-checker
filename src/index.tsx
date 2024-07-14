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
      <h1>Email Address/Domain Verification Result</h1>
      <div>{result}</div>
    </div>
  );
};

const Form = (input: string) => {
  return (
    <form action="">
      <label for="email">Email Address or Domain </label>
      <input type="text" id="email" name="email" value={input} />
      <button type="submit">Check</button>
    </form>
  );
};

function validateEmailOrDomain(text: string) {
  const regex = /^([^\s@]+@)?[^\s@]+\.[^\s@]+$/;
  return regex.test(text);
}

async function verifyEmailOrDomain(text: string) {
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
  const domain = text.split("@")[1] || text;
  return blocklist.includes(domain);
}

app.use(renderer);

app.get("/", async (c) => {
  const renderHtml = [];
  let email = c.req.query("email") || "";
  renderHtml.push(Form(email));
  if (email === "") {
    return c.render(<>{renderHtml}</>);
  }
  if (!validateEmailOrDomain(email)) {
    email = `Invalid Email Address or Domain: ${email}`;
    renderHtml.push(Result(email));
    return c.render(<>{renderHtml}</>);
  }
  const verifyResult = await verifyEmailOrDomain(email);
  if (verifyResult) {
    renderHtml.push(
      Result(`The Domain of this Email Adress is in blocklist: ${email}`)
    );
  } else {
    renderHtml.push(
      Result(`The Domain of this Email Adress is not in blocklist: ${email}`)
    );
  }
  return c.render(<>{renderHtml}</>);
});

export default app;
