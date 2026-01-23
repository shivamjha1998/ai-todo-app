import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { getTask, postQuery } from '../services/api';
import type { Task } from '../types';
import Markdown from 'react-native-markdown-display';

import BackIcon from '../../assets/back.svg';

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

    const threads = task.threads ? [...task.threads].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <BackIcon width={30} height={30} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{task.title}</Text>
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
                    {task.aiStatus === 'PROCESSING' && (
                        <LottieView
                            source={require('../../assets/loading.lottie')}
                            autoPlay
                            loop
                            style={styles.lottie}
                        />
                    )}
                    {threads.map((thread) => (
                        <View key={thread.id} style={[styles.threadCard, thread.role === 'ASSISTANT' ? styles.assistantCard : styles.userCard]}>
                            <Text style={styles.threadRole}>{thread.role === 'ASSISTANT' ? '🤖 AI' : '👤 You'}</Text>
                            <Markdown style={markdownStyles}>{thread.content}</Markdown>
                        </View>
                    ))}
                    {threads.length === 0 && task.aiStatus !== 'PROCESSING' && <Text style={styles.emptyText}>No conversation yet.</Text>}
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
        backgroundColor: '#eee8e6',
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
    },
    backButton: {
        marginRight: 16,
        width: 40,
        height: 40,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#000',
        backgroundColor: '#fbb640',
        justifyContent: 'center',
        alignItems: 'center',
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
        backgroundColor: '#5dcdf3',
    },
    badgeSuccess: {
        backgroundColor: '#7fba94',
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
        borderColor: '#5dcdf3',
        borderLeftWidth: 4,
        borderLeftColor: '#5dcdf3',
    },
    userCard: {
        backgroundColor: '#fff',
        borderColor: '#fa8a8b',
        borderRightWidth: 4,
        borderRightColor: '#fa8a8b',
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
        borderWidth: 1,
        borderColor: '#000',
    },
    sendButton: {
        backgroundColor: '#7fba94',
        borderRadius: 20,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#000',
    },
    disabledButton: {
        backgroundColor: '#7fba948a',
        borderColor: 'transparent',
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    lottie: {
        width: 150,
        height: 150,
        alignSelf: 'center',
    },
});

const markdownStyles = StyleSheet.create({
    body: {
        fontSize: 16,
        lineHeight: 22,
        color: '#333',
    },
});
