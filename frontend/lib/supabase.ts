import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fdmaewjgqaqfsittmvdv.supabase.co";
const supabaseAnonKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkbWFld2pncWFxZnNpdHRtdmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3Nzc5NzksImV4cCI6MjA2NTM1Mzk3OX0.XN0csEYVNDiYN2TQDmuVzQNC1s7uyx19FlejbZc2iHQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		storage: AsyncStorage,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
		flowType: 'pkce',
		debug: false,
	},
	global: {
		headers: {
			'X-Client-Info': 'divi-app',
		},
	},
});
