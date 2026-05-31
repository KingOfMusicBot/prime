import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('accessToken')?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }
    const logFile = path.join(logsDir, 'app.log.txt');
    const logLine = `[${new Date().toISOString()}] ${JSON.stringify(body)}\n`;
    fs.appendFileSync(logFile, logLine);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to write log' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'GET method not supported' }, { status: 405 });
}
