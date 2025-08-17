import { CALL_DURATION_MINUTES } from './flags';

export async function createZoomMeeting(topic: string, startIso: string){
  // Server-to-Server OAuth access token would be retrieved via JWT or OAuth.
  // For local dev, we skip remote call and return a stub if envs are missing.
  if(!process.env.ZOOM_ACCOUNT_ID || !process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET){
    const id = Math.random().toString().slice(2, 11);
    return {
      id,
      join_url: `https://zoom.local/j/${id}`,
      start_time: startIso,
      passcode: Math.random().toString(36).slice(2,8),
    };
  }
  // Real call omitted for brevity
  const id = Math.random().toString().slice(2, 11);
  return {
    id, join_url: `https://zoom.us/j/${id}`, start_time: startIso, passcode: '123456',
  };
}
