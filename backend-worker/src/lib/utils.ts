export const toClientRole = (dbRole: string) => {
  return dbRole.replace('_', '-').toLowerCase();
};

export const toDbRole = (clientRole: string) => {
  return clientRole.replace('-', '_').toUpperCase();
};

export const jsonResponse = (data: any, status = 200) => {
  return Response.json(data, { status });
};

export const errorResponse = (message: string, status = 400) => {
  return Response.json({ success: false, message }, { status });
};

export const parseJSON = (str: string | null) => {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
};
