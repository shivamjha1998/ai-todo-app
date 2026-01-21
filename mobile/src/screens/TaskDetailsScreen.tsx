import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getTask, postQuery } from '../services/api';
import type { Task, AiThread } from '../types';
import Markdown from 'react-native-markdown-display';

// Simple Markdown-like renderer (React Native doesn't support HTML/Markdown natively without heavy libs)
// For this MVP, we will just render text. 
// A production app would use `react-native-markdown-display`.

export default function TaskDetailsScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { taskId } = route.params;

    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [question, setQuestion] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        loadTask();
    }, [taskId]);

    useEffect(() => {
        if (task?.aiStatus === 'PROCESSING') {
            const interval = setInterval(() => {
                loadTask();
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [task?.aiStatus]);

    const loadTask = async () => {
        try {
            const data = await getTask(taskId);
            setTask(data);
        } catch (error) {
            console.error('Failed to load task', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendQuery = async () => {
        if (!question.trim()) return;

        setIsAsking(true);
        try {
            await postQuery(taskId, question);
            setQuestion('');
            await loadTask();
            // Scroll to bottom
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 500);
        } catch (error) {
            console.error('Failed to send query', error);
        } finally {
            setIsAsking(false);
        }
    };

    if (loading) return <ActivityIndicator style={styles.center} />;
    if (!task) return <View style={styles.center}><Text>Task not found</Text></View>;

    // Sort threads like web: createdAt ascending
    const threads = task.threads ? [...task.threads].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{task.title}</Text>
                <View style={[styles.badge, task.status === 'COMPLETED' ? styles.badgeSuccess : styles.badgePrimary]}>
                    <Text style={styles.badgeText}>{task.status}</Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                ref={scrollViewRef}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                <View style={styles.section}>
                    <Text style={styles.label}>Description</Text>
                    <Text style={styles.text}>{task.description || 'No description'}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>AI Assistant & Threads</Text>
                    {threads.map((thread) => (
                        <View key={thread.id} style={[styles.threadCard, thread.role === 'ASSISTANT' ? styles.assistantCard : styles.userCard]}>
                            <Text style={styles.threadRole}>{thread.role === 'ASSISTANT' ? '🤖 AI' : '👤 You'}</Text>
                            <Markdown style={markdownStyles}>{thread.content}</Markdown>
                        </View>
                    ))}
                    {threads.length === 0 && <Text style={styles.emptyText}>No conversation yet.</Text>}
                </View>
            </ScrollView>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Ask AI..."
                        value={question}
                        onChangeText={setQuestion}
                        editable={!isAsking}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!question.trim() || isAsking) && styles.disabledButton]}
                        onPress={handleSendQuery}
                        disabled={!question.trim() || isAsking}
                    >
                        {isAsking ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.sendButtonText}>Send</Text>}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        marginRight: 16,
    },
    backButtonText: {
        fontSize: 16,
        color: '#007AFF',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgePrimary: {
        backgroundColor: '#007AFF',
    },
    badgeSuccess: {
        backgroundColor: '#34C759',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        color: '#666',
        textTransform: 'uppercase',
        marginBottom: 8,
        fontWeight: '600',
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
    },
    threadCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    assistantCard: {
        backgroundColor: '#fff',
        borderColor: '#007AFF',
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    userCard: {
        backgroundColor: '#f0f0f0',
    },
    threadRole: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#666',
        textTransform: 'uppercase',
    },
    threadContent: {
        fontSize: 16,
        lineHeight: 22,
        color: '#333',
    },
    emptyText: {
        color: '#999',
        fontStyle: 'italic',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 12,
        fontSize: 16,
    },
    sendButton: {
        backgroundColor: '#007AFF',
        borderRadius: 20,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#B4D6FF',
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: '600',
    }
});

const markdownStyles = StyleSheet.create({
    body: {
        fontSize: 16,
        lineHeight: 22,
        color: '#333',
    },
});
