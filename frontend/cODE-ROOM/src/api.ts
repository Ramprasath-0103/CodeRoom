
import axios from "axios";
import { LANGUAGE_VERSIONS } from "./constants";

const API = await axios.create(
{
    baseURL : "https://emkc.org/api/v2/piston"
}
);

export async function executeCode(language, sourceCode) {
    {
        const response = await API.post("/execute", {
            language : language,
            version : LANGUAGE_VERSIONS[language],
            files : [
                {
                    content : sourceCode
                }
            ]
        });

        return response.data;
}
};