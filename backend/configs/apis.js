const APIs = {
  omegatech: {
    type: "rest",
    baseURL: process.env.OMEGATECH_BASE_URL || "https://omegatech-api.dixonomega.tech",
  },
  ...(process.env.HCNSEC_API_KEY && {
    hcnsec: {
      type: "openai-compatible",
      baseURL: process.env.HCNSEC_BASE_URL || "https://api.hcnsec.cn/v1",
      apiKey: process.env.HCNSEC_API_KEY,
    },
  }),
};

export const listApis = () =>
  Object.fromEntries(
    Object.entries(APIs).map(([name, api]) => [name, { ...api, apiKey: undefined }]),
  );

export default APIs;
