---
title: Clang预处理器源码阅读
author: 孙子平
date: 2021-02-27T17:22:11Z
category: Tilly
tags: [编程, Tilly]
---

这篇文章是对Clang编译预处理器代码阅读的笔记。之所以阅读预处理器的代码，是为了用Rust重新实现一个编译预处理，最终为我的Tilly项目服务。

<!-- more -->

## 1 项目下载与调试

将GitHub上的[llvm/llvm-project](https://github.com/llvm/llvm-project)项目clone到本地后，可以用CLion在子目录`llvm`中打开项目，然后选择Tools -> CMake -> Change Project Root，将根目录切换到项目的根目录。

还需要修改一下CMake的配置，可在设置中搜索CMake。CMake options改为`-DLLVM_ENABLE_PROJECTS="clang"`，Build directory设为`build`。

调试的时候，由于程序会fork自身，在项目的入口（`clang/tools/driver/driver.cpp`）放置一个断点。然后输入以下GDB命令。

```text
set detach-on-fork off
set schedule-multiple
```

这样就可以使子程序也能命中断点。

## 2 编译预处理器调用流程

`main`函数会：

1. 初始化LLVM
2. 从第一个命令行参数中解析出目标和模式（如前缀`x86_64-pc-linux-gnu`表示目标平台为64位Linux，后缀`cl`表示模式为MSVC兼容的）
3. 展开命令行中的[response files](https://llvm.org/docs/CommandLine.html#response-files)（`@files`形式的参数）
4. 如果命令行的第二个参数是：
   - `-cc1`，则**执行编译器**（入口为`cc1_main`），并退出
   - `-cc1as`，则执行基于LLVM MC的汇编器，并退出
   - `-cc1gen-reproducer`，则为Clang相关的工具生成可复现的文件，并退出
5. TODO

## 3 实现细节

### 3.1 类型系统

位于`clang/include/clang/AST/Type.h`和`clang/lib/AST/Type.cpp`中。

#### 3.1.1 `Qualifiers`类

Unscoped枚举成员：

|名字|含义|
|:-|:-|
|`TQ`|CVR限定词，做成了bitset，包含成员`CVRMask`为掩码|
|`GC`|用于Object-C的垃圾回收（不太清楚）|
|`ObjCLifetime`|Object-C的生命周期（不太清楚）|
|匿名| |快速的3bit掩码，和23bit的最大地址空间|

快速掩码和CVR掩码被`static_assert`为相同的（也有地方断言为快速掩码包含CVR掩码）。但含义上，快速掩码是指能塞进指针中的短小整型，用以加速访问。这里地址空间其实包含几个预定义的，如OpenCL或者CUDA相关的，或者也可以自定义（`__attribute__(address_space(n)))`）。

成员变量：

|名字|含义|
|:-|:-|
|`uint32_t Mask`|见下|

```text
bits:     |0 1 2|3|4 .. 5|6  ..  8|9   ...   31|
          |C R V|U|GCAttr|Lifetime|AddressSpace|
```

其中`U`表示unaligned。


关键的方法：

|名字|含义|
|:-|:-|
|`static Qualifiers removeCommonQualifiers(Qualifiers &L, Qualifiers &R)`|移除`L`和`R`的公共限定词，并返回它|
|`bool hasNonFastQualifiers() const`|包含非快速限定词，出发`ExtQuals`的分配|