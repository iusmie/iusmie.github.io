# React Hooks 最佳实践

## useState 的高级用法

### 函数式更新
```javascript
const [count, setCount] = useState(0);

// 推荐：函数式更新
setCount(prevCount => prevCount + 1);

// 不推荐：直接依赖当前值
setCount(count + 1);
```

### 复杂状态的优化
```javascript
const [state, setState] = useState({
  loading: false,
  data: null,
  error: null
});

// 使用展开运算符避免状态丢失
setState(prevState => ({
  ...prevState,
  loading: true
}));
```

## useEffect 的依赖管理

### 清理副作用
```javascript
useEffect(() => {
  const subscription = source.subscribe();
  
  // 清理函数
  return () => {
    subscription.unsubscribe();
  };
}, [source]);
```

### 条件执行
```javascript
useEffect(() => {
  if (shouldFetch) {
    fetchData();
  }
}, [shouldFetch]);
```

## 自定义 Hooks

### 封装可复用逻辑
```javascript
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    function handleResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
```

## 性能优化技巧

### 1. 使用 useMemo 缓存计算结果
```javascript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);
```

### 2. 使用 useCallback 缓存函数
```javascript
const handleClick = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

### 3. 合理使用 useRef
```javascript
const inputRef = useRef(null);

const focusInput = () => {
  inputRef.current?.focus();
};
```

## 常见陷阱与解决方案

### 1. 闭包陷阱
```javascript
// 问题：count 不会更新
useEffect(() => {
  const timer = setInterval(() => {
    console.log(count); // 永远是初始值
  }, 1000);
  return () => clearInterval(timer);
}, []); // 空依赖数组

// 解决方案：使用函数式更新
useEffect(() => {
  const timer = setInterval(() => {
    setCount(prevCount => {
      console.log(prevCount); // 正确的当前值
      return prevCount;
    });
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

### 2. 依赖数组不完整
```javascript
// 错误：eslint 会警告
useEffect(() => {
  console.log(value);
}, []); // value 没有包含在依赖中

// 正确
useEffect(() => {
  console.log(value);
}, [value]); // 包含所有依赖
```

## 总结

React Hooks 提供了强大的状态管理和副作用处理能力，但需要遵循最佳实践来避免常见陷阱。关键是理解 Hooks 的执行时机和依赖管理机制。
