import { Hono } from "hono";
import { renderer } from "./renderer";

const app = new Hono();
const emailBlocklistUrl =
  "https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf";
const emailAllowlistUrl =
  "https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/allowlist.conf";
const whoisBaseUrl = "https://api.whoisproxy.info/whois";
const digBaseUrl = "https://api.whoisproxy.info/dig";

const Result = (result: string) => {
  return (
    <div>
      <h1>Email Address/Domain Verification Result</h1>
      <div>{result}</div>
    </div>
  );
};

const Dns = (result: string) => {
  return (
    <div>
      <h2>
        DNS Lookup Result (Using{" "}
        <a href="https://chanshige.hatenablog.com/entry/2019/02/16/184907">
          Dig API)
        </a>
      </h2>
      <div class="dns">
        <pre>
          <code>{result}</code>
        </pre>
      </div>
    </div>
  );
};

const Whois = (result: string) => {
  return (
    <div>
      <h2>
        Whois Result (Using{" "}
        <a href="https://chanshige.hatenablog.com/entry/2019/02/16/184907">
          Whois API)
        </a>
      </h2>
      <div class="whois">
        <pre>
          <code>{result}</code>
        </pre>
      </div>
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

async function verifyEmailOrDomain(domain: string) {
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
  return blocklist.includes(domain);
}

async function whoisLookup(domain: string) {
  const url = `${whoisBaseUrl}/${domain}`;
  let responseText = "N/A";

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    responseText = (await response.text()) as string;
    responseText = JSON.parse(responseText).results.raw.join("\n");
    return responseText;
  } catch (error: any) {
    console.error(`fetch error: ${error.message}`);
  }
  return responseText;
}

async function dnsLookup(domain: string) {
  const url = `${digBaseUrl}/${domain}`;
  let responseText = "N/A";

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    responseText = (await response.text()) as string;
    responseText = JSON.parse(responseText).results.join("\n");
  } catch (error: any) {
    console.error(`dns error: ${error.message}`);
  }
  return responseText;
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
  const domain = email.split("@")[1] || email;
  const verifyResult = await verifyEmailOrDomain(domain);
  if (verifyResult) {
    renderHtml.push(
      Result(
        `💣️捨てアドとして利用される疑いがあるEmailドメインです💣️ / 
        💣️The domain of this Email adress is suspected as a disposable email address💣️: ${email}`
      )
    );
  } else {
    renderHtml.push(
      Result(
        `捨てアド疑いのリストにはありませんが、下記の情報も参考にしてください👇 / 
        The domain of this Email address is not in suspected list but be careful: ${email}`
      )
    );
    const dnsResult = await dnsLookup(domain);
    renderHtml.push(Dns(dnsResult));
    const whoisResult = await whoisLookup(domain);
    renderHtml.push(Whois(whoisResult));
  }
  return c.render(<>{renderHtml}</>);
});

export default app;
