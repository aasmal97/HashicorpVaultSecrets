import fs from "fs";

export function generateEnvFile(envFileName: string, envContent: string) {
  try {
    fs.writeFileSync(envFileName, envContent.trim());
    console.log(".env file generated successfully!");
  } catch (error) {
    console.error(`Error generating .env file: ${error}`);
  }
}
