import { API_ENDPOINTS } from '../config/api';
import { getToken } from '../lib/auth';


export interface Skill {
    name: string;
    level: number;
    category: string;
}

export interface DynamicSkillsProfile {
    name: string;
    skills: Skill[];
}

export async function fetchDynamicSkillsProfile(): Promise<DynamicSkillsProfile | null> {
    try {
        const token = getToken();

        if (!token) {
            return null;
        }

        const response = await fetch(`${API_ENDPOINTS.SKILLS}/profile`, {

            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                return null;
            }
            throw new Error(`Failed to fetch dynamic skills profile: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        return null;
    }
}
