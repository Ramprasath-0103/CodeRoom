import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000",
});

export async function createFile(
  workspaceId: string,
  name: string,
) {
  const response = await api.post(
    `/workspace/${workspaceId}/file`,
    {
      name,
    },
  );

  return response.data;
}