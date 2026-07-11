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

export async function renameFileApi(
  fileId: string,
  name: string
) {
  const response = await api.patch(
    `/workspace/file/${fileId}`,
    {
      name,
    }
  );

  return response.data;
}


export async function deleteFileApi(fileId: string) {
  const response = await api.delete(`/workspace/${fileId}`);

  return response.data;
}

