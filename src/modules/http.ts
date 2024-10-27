import * as http from "https";

export function httpGet(url: string): Promise<string> {
    const parsedUrl = new URL(url);

    return new Promise((resolve, reject) => {
        let data = "";

        http.get(parsedUrl, res => {
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`Request failed. Status Code: ${res.statusCode}`));
            }

            res.on("data", chunk => (data += chunk));
            res.on("end", () => resolve(data));
        }).on("error", err => reject(new Error(`Network error: ${err.message}`)));
    });
}

export async function getData(url: string): Promise<string | null> {
    try {
        return await httpGet(url);
    } catch (e: unknown) {
        console.error(`Error fetching data: ${e instanceof Error ? e.message : e}`);
        return null;
    }
}
