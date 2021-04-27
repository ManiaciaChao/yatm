import fetch, { RequestInfo, RequestInit, HeadersInit } from 'node-fetch';
import { userAgent } from './consts';

const baseHeaders: HeadersInit = {
  'User-Agent': userAgent,
  'Content-Type': 'application/json',
  Accept: '*/*',
  'Accept-Language': 'zh-CN,en-US;qbaseHeaders=0.7,en;q=0.3',
};

const request = <T = any>(url: RequestInfo, init?: RequestInit): Promise<T> =>
  fetch(url, init).then((data) => data.json());

export interface IBasicSignInfo {
  courseId: number;
  signId: number;
}

export interface IActiveSign extends IBasicSignInfo {
  isGPS?: 1 | 0;
  isQR?: 1 | 0;
  name: string;
  code: string;
  startYear: number;
  term: string;
  cover: string; // url
}

export type ActiveSignResp = IActiveSign[];

export const activeSign = (openId: string) =>
  request<ActiveSignResp>(
    'https://v18.teachermate.cn/wechat-api/v1/class-attendance/student/active_signs',
    {
      headers: {
        ...baseHeaders,
        openId,
        'If-None-Match': '"38-djBNGTNDrEJXNs9DekumVQ"',
        Referrer: `https://v18.teachermate.cn/wechat-pro-ssr/student/sign?openid=${openId}`,
      },
      method: 'GET',
    }
  );

export interface ISignInQuery {
  courseId: number;
  signId: number;
  lon?: number;
  lat?: number;
}
export interface ISignInResp {
  errorCode: number;
}

export const signIn = (openId: string, query: ISignInQuery) =>
  request<ISignInResp>(
    'https://v18.teachermate.cn/wechat-api/v1/class-attendance/student-sign-in',
    {
      headers: {
        ...baseHeaders,
        openId,
        Referrer: `https://v18.teachermate.cn/wechat-pro-ssr/student/sign?openid=${openId}`,
      },
      body: JSON.stringify(query),
      method: 'POST',
    }
  );

interface IStudentRole {
  id: number;
  student_id: number;
  college_id: number;
  department_id: number;
  class_name: string;
  specialty: string;
  student_number: string;
  comment: any;
  deleted: number;
  org_id: any;
  college_name: string;
  department_name: string;
}

type StudentRoleResp = IStudentRole[] | { message: string };

export const studentsRole = (openId: string) =>
  request<StudentRoleResp>(
    'https://v18.teachermate.cn/wechat-api/v2/students/role',
    {
      headers: {
        ...baseHeaders,
        openId,
        Referrer: `https://v18.teachermate.cn/wechat-pro/student/archive/lists?openid=${openId}`,
      },
      method: 'GET',
    }
  );

const studentInfo = (openId: string) =>
  request<Record<'item_name' | 'item_value', string>[][]>(
    'https://v18.teachermate.cn/wechat-api/v2/students',
    {
      headers: {
        ...baseHeaders,
        openId,
        Referrer: `https://v18.teachermate.cn/wechat-pro/student/edit?openid=${openId}`,
      },
      method: 'GET',
    }
  );

export const getStudentName = (openId: string) =>
  studentInfo(openId).then(
    (resp) => resp[0].find((item) => item.item_name === 'name')!.item_value
  );

export const checkInvaild = async (openId: string) => {
  const data = await studentsRole(openId);
  return 'message' in data || data.length === 0;
};
