import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { StyleSheet, View, Alert } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "expo-router";

export default function Account({ session }: { session: Session }) {
	const [loading, setLoading] = useState(true);
	const [username, setUsername] = useState("");
	const [website, setWebsite] = useState("");
	const [avatarUrl, setAvatarUrl] = useState("");
	const router = useRouter();

	useEffect(() => {
		if (session) getProfile();
	}, [session]);

	async function getProfile() {
		try {
			setLoading(true);
			if (!session?.user) throw new Error("No user on the session!");

			const { data, error, status } = await supabase
				.from("profiles")
				.select(`username, website, avatar_url`)
				.eq("id", session?.user.id)
				.single();
			if (error && status !== 406) {
				throw error;
			}

			if (data) {
				setUsername(data.username);
				setWebsite(data.website);
				setAvatarUrl(data.avatar_url);
			}
		} catch (error) {
			if (error instanceof Error) {
				Alert.alert(error.message);
			}
		} finally {
			setLoading(false);
		}
	}

	async function updateProfile({
		username,
		website,
		avatar_url,
	}: {
		username: string;
		website: string;
		avatar_url: string;
	}) {
		try {
			setLoading(true);
			if (!session?.user) throw new Error("No user on the session!");

			const updates = {
				id: session?.user.id,
				username,
				website,
				avatar_url,
				updated_at: new Date(),
			};

			const { error } = await supabase.from("profiles").upsert(updates);

			if (error) {
				throw error;
			}
		} catch (error) {
			if (error instanceof Error) {
				Alert.alert(error.message);
			}
		} finally {
			setLoading(false);
		}
	}

	async function signOut() {
		try {
			setLoading(true);
			await supabase.auth.signOut();
			router.replace("/home");
		} catch (error) {
			if (error instanceof Error) {
				Alert.alert(error.message);
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<View style={styles.container}>
			<View style={[styles.verticallySpaced, styles.mt20]}>
				<TextInput
					label="Email"
					value={session?.user?.email}
					disabled
					left={<TextInput.Icon icon="email" />}
				/>
			</View>
			<View style={styles.verticallySpaced}>
				<TextInput
					label="Username"
					value={username || ""}
					onChangeText={(text) => setUsername(text)}
					left={<TextInput.Icon icon="account" />}
				/>
			</View>
			<View style={styles.verticallySpaced}>
				<TextInput
					label="Website"
					value={website || ""}
					onChangeText={(text) => setWebsite(text)}
					left={<TextInput.Icon icon="web" />}
				/>
			</View>

			<View style={[styles.verticallySpaced, styles.mt20]}>
				<Button
					mode="contained"
					onPress={() =>
						updateProfile({
							username,
							website,
							avatar_url: avatarUrl,
						})
					}
					loading={loading}
				>
					Update Profile
				</Button>
			</View>

			<View style={styles.verticallySpaced}>
				<Button mode="outlined" onPress={signOut} icon="logout">
					Sign Out
				</Button>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginTop: 40,
		padding: 12,
	},
	verticallySpaced: {
		paddingTop: 4,
		paddingBottom: 4,
		alignSelf: "stretch",
	},
	mt20: {
		marginTop: 20,
	},
});
