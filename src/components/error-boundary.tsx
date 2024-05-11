import React, { ReactNode } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../styles';

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { error: null | unknown };

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }

  static logError(error: unknown, errorInfo: any) {
    if (typeof error === 'string') {
      console.error('ErrorBoundary:', error);
    } else if (error instanceof Error) {
      console.error('ErrorBoundary:', error.message);
    }

    if (errorInfo && errorInfo.hasOwnProperty('componentStack')) {
      console.error('ErrorBoundary stack:', errorInfo.componentStack);
    }
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    this.setState({
      error: error,
    });

    ErrorBoundary.logError(error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.errorHolder}>
          <Text>Something went wrong. Please try again.</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorHolder: {
    alignItems: 'center',
    backgroundColor: Colors.app.background,
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
});

export default ErrorBoundary;
