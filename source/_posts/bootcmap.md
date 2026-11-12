---
title: 如何给老mac装Windows——BootCamp踩坑小记
date: 2026-11-12 10:00:00
tags: 修机日记
toc: true
---

前段时间搞了一单macbook air 2017的windows重装，过程有些坎坷，在这里把踩坑记录都写一下，虽然我之前用过bootcamp但是也已经好久没摸mac了，有些问题需要重新写一下。
首先需要注意的是，由于mac的uefi自动阻止PE盘启动，所以无法通过PE盘进行重装系统，任何走PE盘的办法都应该注意这点。那你可能会问，350老师，既然没办法用PE装用什么装呢？这里就需要使用MacOS自带的bootcamp软件了。bootcamp(启动助理)是苹果对于使用intel处理器的mac对于Windows双系统安装所自带的系统软件（好像也可以装linux发行版），可用于自动安装mac所带的非windows免驱硬件的驱动。
其实过程很轮椅，按住option+R选择MacOS启动，然后你只需要在macOS里面找到bootcamp程序，点进去安装就好了，但是需要注意**windows的系统镜像应当小于4GB**。也就意味着你要不然给现有镜像做一下精简要不谈就要找一个LTSC或者1903之前的版本一路升级上去。
这里需要注意的是，mac的所有网卡和硬件设备都是不免驱动的，我们只需要安装后重启电脑，就能在windows系统中看到一个新的盘符，找到其中的bootcamp启动助理程序并打开，进行安装驱动程序即可。
关于bootcamp版本：因为bootcamp4和5不支持windows10，请在安装双系统前将MacOS升级到最高版本以便使用bootcamp6。