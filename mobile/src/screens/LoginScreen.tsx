import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { login as loginApi, register } from '../services/api';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const navigation = useNavigation<any>();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (isRegistering && !name.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }

        setLoading(true);
        try {
            let token;
            let user;
            if (isRegistering) {
                const response = await register({ email, password, name });
                token = response.token;
                user = response.user;
            } else {
                const response = await loginApi({ email, password });
                token = response.token;
                user = response.user;
            }

            if (token && user) {
                await login(token, user);
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || error.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <SafeAreaView style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>AI Todo App</Text>
                    <Text style={styles.subtitle}>{isRegistering ? 'Create an account' : 'Welcome back'}</Text>
                </View>

                <View style={styles.form}>
                    {isRegistering && (
                        <TextInput
                            style={styles.input}
                            placeholder="Name"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />
                    )}
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isRegistering ? 'Sign Up' : 'Log In'}</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={styles.switchButton}>
                        <Text style={styles.switchText}>
                            {isRegistering ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#eee8e6',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        marginBottom: 48,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    form: {
        width: '100%',
    },
    input: {
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 12,
        borderColor: '#000',
        borderWidth: 2,
        margin: 8,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#fae29d',
        padding: 16,
        borderRadius: 12,
        borderColor: '#000',
        borderWidth: 2,
        alignItems: 'center',
        margin: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
    },
    switchButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    switchText: {
        color: '#000',
        fontSize: 14,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});
