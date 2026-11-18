# myCobot User Manual

**Shenzhen Elephant Robotics Technology Co., Ltd.**

- Language: English
- Version: V 2020.03.18

*[Image: myCobot robotic arm on its base]*

---

## Copyright Declaration

No unit or individual may extract, compile, translate or reproduce any contents of this manual (eg: technical documentation, software, etc.), nor disseminate in any form (including materials and publications) without the written permission of Shenzhen Elephant Robotics Technology Co., Ltd. (hereinafter referred to as "Elephant Robotics").

In addition, the product information and related resources mentioned in this manual are for reference only and the contents are subject to change without notice.

Except as expressly stated in this manual, nothing in this manual should be construed as any warranty or guarantee by the Elephant Robotics of personal loss, damage to property, or fitness for a particular purpose.

All rights reserved!

| Version | Description | Note |
|---|---|---|
| V 2020.12.31 | Added picture of myCobot【standard set】, Base Assembly, and End Assembly | |
| V 2021.02.04 | Added picture of Coordinate System, MyStudio Software | |
| V 2021.03.17 | Added installation about ROS, RoboFlow download link and usage tutorials, the drag operation is more detailed | |

© Copyright 2020 Shenzhen Elephant Robotics Technology Co., Ltd. All rights reserved.

---

## Overview

### About the manual

Welcome to use MyCobot collaborative robot and thank you for your purchase.
This manual describes the precautions for proper installation and use of MyCobot.
Please read this manual and other related manuals carefully before installing this robot system. After reading, please keep it in a safe place so that you can access it at any time.

### Reading objects of the manual

This manual is targeted to:

- Installer.
- Debugger.
- Maintenance staff.

> **Attention:** Those who install/debug/maintain the MyCobot collaborative robot must be trained in Elephant Robotics and have the mechanical and electronic knowledge required for the above work.

### How to use

This manual should be used when doing the following works:

- **Installation work:** Move the robot to the working position and fix it to the base according to the installation instructions.
- **Debugging:** Debugging the robot to work status.
- **Maintenance work:** regular maintenance robot system to ensure its normal functioning. When the robot malfunctions due to environmental influences or improper operation of the user, or a certain component of the robot system exceeds the normal service life, the robot needs to be repaired.

**Note:**

1. This manual is applicable to international users, as well as users in Hong Kong, Macao and Taiwan.
2. This manual is not updated regularly. The updated date is the version number. Users can download the latest version from the official website of Elephant Robot at any time.

---

## Table of Contents

1. [Security](#1-security)
   - 1.1 [Hazard Identification](#11-hazard-identification)
   - 1.2 [Safety Precautions](#12-safety-precautions)
   - 1.3 [Usage scenarios](#13-usage-scenarios)
2. [About myCobot](#2-about-mycobot)
   - 2.1 [Background](#21-background)
   - 2.2 [Introduction](#22-introduction)
   - 2.3 [Features](#23-features)
   - 2.4 [Patents](#24-patents)
3. [Hardware](#3-hardware)
   - 3.1 [Controller and Actuator](#31-controller-and-actuator)
   - 3.2 [Mechanical Structure](#32-mechanical-structure)
   - 3.3 [Electronics and Electrical](#33-electronics-and-electrical)
4. [Software](#4-software)
   - 4.1 [Firmware Upgrade and Recovery - myStudio](#41-firmware-upgrade-and-recovery---mystudio)
   - 4.2 [Built-in Track Recording](#42-built-in-track-recording)
   - 4.3 [Arduino Libraries](#43-arduino-libraries)
   - 4.4 [API Interface and Communication](#44-api-interface-and-communication)
   - 4.5 [ROS](#45-ros)
   - 4.6 [Joint Calibration](#46-joint-calibration)
5. [Visual Programming and Industrial Software](#5-visual-programming-and-industrial-software)
   - 5.1 [Visual Programming Software - UIFlow](#51-visual-programming-software---uiflow)
   - 5.2 [Industrial Visualization Programming Software - RoboFlow](#52-industrial-visualization-programming-software---roboflow)
6. [After-sales Service](#6-after-sales-service)
7. [Q&A](#7-qa)
8. [Contact Us](#8-contact-us)

---

## 1. Security

This chapter details general safety information for people who perform installation, maintenance, and repair work on the robots. Please read and understand the contents and precautions of this chapter before handling, installation and use.

### 1.1 Hazard Identification

The safety of the collaborative robot is based on the premise of proper configuration and use of the robot, and even if all safety instructions are observed, the injury or damage caused by the operator may still occur. Therefore, it is very important to understand the safety hazards of robot use, which is beneficial to prevent problems before they occur.

Tables 1-2 to 1-4 below are common safety hazards that may exist in the context of using robots:

#### Table 1-2 Dangerous safety hazards (Danger)

| # | Hazard |
|---|---|
| 1 | Personal injury or robot damage caused by incorrect operation during robot handling. |
| 2 | Personal injury or robot damage caused because the robot is not fixed as required, for example, the screw is not screwed or tightened, and the base is not enough to stably support the robot for high-speed movement, causing the robot to tip down. |
| 3 | Failure to perform proper safety function configuration of the robot, or installation of safety protection tools, etc., may cause the safety function of the robot to fail. |

#### Table 1-3 Warning level security risks (Warning)

| # | Risk |
|---|---|
| 1 | Play around the robot, you may be hit by a running robot, or be tripped by an obstacle such as a cable to cause personal injury. |
| 2 | Unauthorized personnel change the security configuration parameters, causing the safety function to fail or danger. |
| 3 | Scratches and punctures caused by sharp surfaces such as other devices in the work environment or robot end effector. |
| 4 | The robot is a precision machine and pedaling may cause damage to the robot. |
| 5 | If the clamp is not in place or before the power supply of the robot is turned off or the gas source is turned off (it is not determined whether the end effector firmly holds the object without falling off due to loss of power). If the clamped object is not removed, it may cause danger, such as people being injured by crashing. |
| 6 | There is a risk of accidental movement of the robot. Under no circumstances should you stand under any axis of the robot! |
| 7 | The robot is a precision machine. If it is not placed smoothly during handling, it may cause vibration and may cause damage to the internal components of the robot. |

#### Table 1-4 Potential safety hazards that may result in electric shock (Caution Electricity)

| # | Hazard |
|---|---|
| 1 | Using a non-original cable may pose an unknown hazard. |
| 2 | Contact with liquids by electrical equipment may result in a risk of electric leakage. |
| 3 | There may be an electric shock hazard when the electrical connection is incorrect. |
| 4 | Be sure to handle replacement work after turning off the power to the controller and related equipment and unplugging the power cord. If the work is performed while the power is on, it may cause electric shock or malfunction. |

### 1.2 Safety Precautions

**The following security rules should be followed when using myCobot:**

- myCobot is electrical equipment. Non-professional technicians cannot modify the wire, otherwise it is vulnerable to injure the device or the person.
- The DANGER, WARNING marks in this manual are only supplemental to the security precautions.
- Please use myCobot in the specific environment scope. If not, exceeding the specifications and load conditions will shorten the service life of the product even damage the equipment.
- Before operating and maintaining myCobot, the personnel responsible for the installation, operation and maintenance must be trained to understand the various security precautions and to the correct methods of operation and maintenance.
- Do not use myCobot in damp environment for a long time in order to avoid damage, myCobot belongs to precision electronic components.
- Do not use myCobot in high temperature environment. The outer surface of myCobot is made of photosensitive resin as raw material, high temperature will damage the shell and lead to failure.
- Highly corrosive cleaning is not suited to cleaning myCobot. The anodized components are not suitable for immersion cleaning.
- Do not use myCobot without mounting base to avoid damage to the equipment or accidents. myCobot should be used in a fixed and unobtrusive environment.
- Do not use other power adapters to supply power to myCobot. If it is damaged due to the use of non-conforming adapter, it will not be included in after-sales service.
- Please do not disassemble or unscrew the screws and its shell. If it's opened, no warranty service can be provided.
- People cannot repair myCobot without professional training. If there is a problem with myCobot, please contact myCobot technical support engineer in time.
- Please comply with the relevant laws to deal with scrapped myCobot, and protect the environment.
- DO NOT let children play with myCobot alone. All processes need to be monitored while running. After processes have finished, please turn off the equipment promptly.
- It is prohibited to modify or remove the nameplates, instructions, icons and marks on the robotic arm and the related equipment.
- Do not burn other product drivers to the terminal Atom. If the device is damaged because of that, it will not be included in the after-sales service.

**Please do not use the Catbot collaborative robot for the following purposes:**

- Medical and life-critical applications.
- In environment that may cause an explosion.
- Used directly without risk assessment.
- Insufficient use of safety function levels.
- Inconsistent use of robot performance parameters.

If you have any question about this manual please visit and submit your feedback on: <https://www.elephantrobotics.cn>.

### 1.3 Usage scenarios

*[Image: table of usage scenarios by development difficulty, across the columns PC, Basic and Atom]*

| Level | Mode | PC | Basic | Atom |
|---|---|---|---|---|
| 1 | **Built-in recording system** (no programming needed) | Don't need | Default Program / Basic Main-Control | Standard Hardware, Do Not Override |
| 2 | **UI FLOW** (blocky programming) | M5 UIFLOW, Online-Programming | UIFLOW Burnprocess, Provide by M5 | Standard Hardware, Do Not Override |
| 3 | **RoboFlow Professional** (blocky programming) | RoboFlow Library | Transponder | Standard Hardware, Do Not Override |
| 4 | **MAKER** (programming needed) | Arduino IDE + M5Stack Library + MycobotBasic Lib | Programs custom: 1 SimpleTest, 2 SimpleRun | Standard Hardware, Do Not Override |
| 4 | **PC API** (programming needed) | Python / C++ / Java | Transponder | Standard Hardware, Do Not Override |
| 5 | **ROS Development** (deep development) | ROS Library | Transponder | Standard Hardware, Do Not Override |

---

## 2. About myCobot

### 2.1 Background

Upholding the mission of "Enjoy Robots World", Elephant Robotics designed and developed myCobot, the world's smallest and lightest collaborative robot, retaining most functions of industrial robots. With compact and elegant industrial design, excellent and powerful performance, and huge software and hardware development space, myCobot has unlimited possibilities in application expansion.

The design prototype of myCobot is from All-in-one Robot launched by Elephant Robot in China in 2018. As the first integrated collaborative robot in China, it has won the 2019 CAIMRS Industrial Robot Innovation Award and 2019 High-tech Robot Annual "Innovation Technology Award", and has been also sold to more than 30 countries at home and abroad, receiving unanimous praise and recognition from world's top 500 enterprises.

### 2.2 Introduction

myCobot is the world's smallest and lightest six-axis collaborative robot, jointly produced by Elephant Robotics and M5Stack. It is more than a productivity tool full of imaginations, can carry on the secondary development according to the demands of users to achieve personalized customization.

With a weight of 850g, a payload of 250g and an arm length of 350mm, myCobot is compact but powerful, can not only be matched with a variety of end effectors to adapt to different kinds of application scenarios also support the secondary development of multi-platform software to meet the needs of various scenarios such as scientific research and education, smart home and commercial.

#### myCobot - Basic Parameter

| Item | Parameter |
|---|---|
| Degree of Freedom | 6 |
| Payload | 250g |
| Arm span | 350mm |
| Working radius | 280mm |
| Repeatability | ±0.5mm |
| Weight | 850g |
| Power Input | 8V, 5A |
| Working Condition | -5° ~ 45° |
| Communication | USB Type-C |

### 2.3 Features

- **Unique Industrial Design & Extremely Compact**
  myCobot is an integrated modular design and only weighs 850g which is very easy to carry. Its overall body structure is compact with less spare parts and can be quickly disassembled and replaced to realize plug and play.

- **High configuration & Equipped with 2 Screens**
  myCobot contains 6 high-performance servo motors with fast response, small inertia and smooth rotation. The body carries 2 display screens supporting fastLED library to show the expanded application scene more easily and clearly.

- **Lego Connector & Thousands of M5STACK Ecological Application**
  The base and end of myCobot are equipped with Lego Connector, which is suitable for the development of various miniature embedded equipment. Its base is controlled by M5STACK Basic, and thousands of application cases can be use directly.

- **Blocky Programming & Supporting Industrial ROS**
  Using UIFlow visual programming software, programming myCobot is simple and easy for everyone. You can also use Arduino, ROS, or other multiple functional modules of open source system, even RoboFlow, software of industrial robots from Elephant Robotics.

- **Track Recording & Learn by hand**
  Get rid of the traditional point saving mode, myCobot supports drag teaching to record the saved track and can save up to 60mins different Tracks making it easy and fun for new players to learn.

### 2.4 Patents

#### Related Patents about myCobot

| No. | Certificate No. | Patent Name | Patent No. | Patentee |
|---|---|---|---|---|
| 1 | No.8194138 | Mechanical arm linkage and mechanical arm | ZL 2018 20017484.4 | Elephant Robotics |
| 2 | No.8186088 | Mechanical arm joint connector and mechanical arm | ZL 2017 21700594.2 | Elephant Robotics |

| No. | Product | Patent Type | Title | Patent No. |
|---|---|---|---|---|
| 1 | Lightweight robotic arm | Appearance patent | Collective Robot Arm | 2020030683471.3 |

| No. | Invention title | Application Number |
|---|---|---|
| 1 | Method and system for robot posture maintaining, dragging and teaching | ZL 2018 1 1634649.3 |
| 2 | A robot online collision detection method and system based on momentum model | ZL 2019 1 0030748.9 |
| 3 | A Kind of Robot Dynamic Parameter Identification Method Independent of Joint Angular Acceleration | ZL 2019 1 0773865.4 |

*[Image: appearance design patent certificate]*

---

## 3. Hardware

### 3.1 Controller and Actuator

#### 3.1.1 M5STACK Basic Main Controller

**M5STACK BASIC Kit**, like its namesake, is a starter kit among the M5STACK development kit series. It's a modular, stackable, scalable, and portable device which is powered with an ESP-32 core, which makes it open source, low cost, full-function, and easy for developers to handle new product development on all stages including circuit design, PCB design, software, mold design and production. This Basic kit provides a friendly price and full-featured resources which makes it a good starter kit for you to explore IoT.

If you want to explore the fastest way of IoT prototyping, M5STACK development board is the perfect solution. Not like others, M5STACK development board is highly efficient, covered with industrial grade case and **ESP32-based** development board. It integrates with Wi-Fi & Bluetooth modules and contains a dual-core and 16MB of SPI Flash. Together with 30+ M5Stack stackable modules, 40+ extendable units and different levels of program language, you can create and verify your IoT product in a very short time.

Supportive development platforms and programming languages: Arduino, Blocky language with UIFlow, Micropython. Regardless of what level programming skill you have, M5STACK would guide you in every step of the way to realize your idea as well as to the final productization. If you ever played with ESP8266, you would realize that ESP32 is a perfect upgrade out of ESP8266. In comparison, ESP32 has more GPIOs, more analog inputs and two analog outputs, multiple extra peripherals (like a spare UART). Official developing platform ESP-IDF has transplanted with FreeRTOS. With dual-core and real time OS you can get more organized code and much high-speed processor.

M5STACK Basic is consist with two separable parts. The upside part has all kinds of processors, chips, and some other slot components. M-BUS socket, and extendable pins on both sides.

##### 3.1.1.1 Product Features

- ESP32-based
- Built-in Speaker, Buttons, Color LCD, Power/Reset button
- TF card slot (16G Maximum size)
- Magnetic suction at back
- Extendable Pins & Holes
- M-Bus Socket & Pins
- Program Platform: UIFlow, MicroPython, Arduino

##### 3.1.1.2 Parameter

| Resources | Parameter |
|---|---|
| ESP32-D0WDQ6 | 240MHz dual core, 600 DMIPS, 520KB SRAM, Wi-Fi, dual mode Bluetooth |
| Flash | 16MB |
| Power Input | 5V @ 500mA |
| Port | TypeC x 1, GROVE (I2C+I/O+UART) x 1 |
| Core Bottom Port | PIN (G1, G2, G3, G16, G17, G18, G19, G21, G22, G23, G25, G26, G35, G36) |
| IPS Screen | 2 inch, 320x240 Colorful TFT LCD, ILI9342C, Brightness 853nit |
| Speaker | 1W-0928 |
| Button | Custom button x 3 |
| Antenna | 2.4G 3D Antenna |
| Operating Temperature | 32°F to 104°F (0°C to 40°C) |
| Net Weight | 47.2g |
| Gross weight | 93g |
| Product Size | 54 x 54 x 18mm |
| Package Size | 95 x 65 x 25mm |
| Case material | Plastic (PC) |

#### 3.1.2 M5STACK Atom

**ATOM Matrix**, which has a size of only 24*24mm, is the most compact development board in the M5Stack development kit series. It provides more GPIO pins and is very suitable for handy and miniature embedded device development.

The main control adopts the ESP32-PICO-D4 chip, which comes integrated with Wi-Fi and Bluetooth technologies and has 4MB of integrated SPI flash memory. The Atom board provides an Infra-Red LED along with the 5 * 5 RGB LED matrix on the panel, a built-in IMU sensor (MPU6886), and a HY2.0 interface. A general-purpose programmable button is providing below the RGB Led matrix to enable users to add input support to their various projects. The on-board USB interface (Type-C) enables rapid program uploading and execution. One M2 screw hole is provided on the back for mounting the board.

> **Note:** When using the manipulator, please avoid burning the firmware to ATOM at the end of the manipulator. The device only supports our original firmware.
> Please kindly understand the inconvenience brought to you.

##### 3.1.2.1 Features

- ESP32 PICO-based
- Programmable button
- 5*5 RGB LED matrix panel (WS2812C)
- Built-in Infra-red LED
- Built-in MPU6886 Inertial Sensor
- Extendable Pins & Holes
- Program Platform: Arduino, UIFlow

##### 3.1.2.2 Specification

| Resources | Parameter |
|---|---|
| ESP32 | 240MHz dual core, 600 DMIPS, 520KB SRAM, Wi-Fi, dual mode Bluetooth |
| Flash | 4MB |
| Power Input | 5V @ 500mA |
| Port | TypeC x 1, GROVE (I2C+I/O+UART) x 1 |
| PIN Interface | G19, G21, G22, G23, G25, G33 |
| RGB LED | WS2812C 2020 x 25 |
| MEMS | MPU6886 |
| IR | Infrared transmission |
| Button | Custom button x 1 |
| Antenna | 2.4G 3D Antenna |
| Operating Temperature | 32°F to 104°F (0°C to 40°C) |
| Net weight | 3g |
| Gross weight | 14g |
| Product size | 24 x 24 x 14 mm |
| Package size | 24 x 24 x 14 mm |
| Case material | Plastic (PC) |

#### 3.1.3 Servo Motor

myCobot has 6 high-performance servo motors in 6 joints with the advantages of fast response, small inertia, smooth rotation, stable torque, etc.

| Resources | Parameter |
|---|---|
| Size | 23.2*12.1*28.5mm |
| Power input | 4.8~7.4V |
| Operating Temperature | -15~70° |
| Rated torque | 1.5kg.cm @ 6V |
| Stall torque | 4.5kg.cm @ 6V |
| Rotation angle | 300° (Angle can be limited by software) |

### 3.2 Mechanical Structure

#### 3.2.1 Size and working range

##### A) myCobot

*[Image: dimensional drawing. Arm span 350mm; link lengths 70.42 mm, 110.4 mm, 96.0 mm, 73.18 mm; offsets 66.39 mm and 43.6 mm; base height 131.56 mm; working radius r = 280mm; J1 range -160° to +160°]*

**myCobot - Table of joint range of motion**

| Joint | Range | Joint | Range | Joint | Range |
|---|---|---|---|---|---|
| J1 | -165 ~ +165 | J3 | -165 ~ +165 | J5 | -165 ~ +165 |
| J2 | -165 ~ +165 | J4 | -165 ~ +165 | J6 | -175 ~ +175 |

**Picture of Coordinate System**

*[Image: kinematic coordinate system diagram with frames x0–x6, y0–y6, z0–z6 and the end-effector; d1 = 131.56mm, a2 = 110.4mm, a3 = 96mm, d4 = 66.39mm, d5 = 73.18mm]*

##### B) Base Assembly

The base is compatible with both Lego-tech component holes and through-hole screw holes.

*[Image: base drawing, 44 mm × 44 mm spacing; 4 × Ø4.50 through holes; 25 × Ø4.90 through holes (Lego holes)]*

##### C) End Assembly

The end is compatible with both the Lego-tech component hole and the screw thread.

*[Image: end drawing, Ø30; 4 × M3 depth 6.5]*

#### 3.2.2 Unpacking and Installation

##### 3.2.2.1 Unpacking

> **Note:** After the packaging box is in place, please confirm that the robot packaging is intact and undamaged. If there is any damage, please contact the logistics company and the local supplier in time.
> After unpacking, please check the actual items in the box according to the item list.

*[Image: myCobot [standard set] contents]*

**myCobot【standard set】**

- myCobot-280
- Brochure
- Power Supply
- USB-Type C
- Jumper
- M4*35, stainless steel screw
- Hexagon wrench

Please install the robot system in an environment that meets the conditions described in the table in order to exert and maintain the performance of the machine and use it safely.

**Operating Environment and Conditions**

| Item | Requirement |
|---|---|
| Temperature | -10℃ ~ 45℃ |
| Relative humidity | 20% ~ 70% |
| Indoor/Outdoor | Indoor |
| Another Environmental requirement | - Avoid sunlight.<br>- Keep away from dust, oily smoke, salt, iron filings, etc.<br>- Keep away from flammable and corrosive liquids and gases.<br>- Do not contact with water.<br>- Does not transmit shock, vibration, etc.<br>- Keep away from strong electromagnetic interference sources. |

##### 3.2.2.2 Installation

The actual weight of myCobot collaborative robot is 850g. Considering the movement of the robot, the center of gravity will move as the robot moves. Therefore, the robot needs to be fixed on a solid base to be used normally.

**Interface size of robot base:** The pedestal fixing hole is the interface that fixes the robot to other bases or planes. The specific hole size is shown as following. It is 4 through holes with a diameter of 4.5mm, which can be fixed with M4 bolts.

*[Image: base mounting hole drawing, 4 × 4.5mm]*

Make sure that there is a corresponding threaded hole on the fixed base before installing.

**Before you officially install, please confirm:**

- The environment to be installed complies with the requirements above.
- The installation position is not less than the working range of the robot, and there is enough space for installation, use, maintenance and repair.
- Place the stand in the proper position.
- Installation related tools are ready, such as screws, wrenches, etc.

After confirming the above, move the robot to the mounting surface of the base, adjust the position of the robot, and align the fixing hole of the robot base with the hole on the mounting surface of the base.

> **Note:** When adjusting the position of the robot on the mounting base, please avoid pushing the robot directly on the mounting surface of the base to avoid scratches. When manually moving the robot, please try to avoid applying external force to the weak part of the robot body to avoid unnecessary damage to the robot.

### 3.3 Electronics and Electrical

myCobot has three external terminals. They are the external terminals of M5Stack Basic on the base, the two Grove terminals near the power socket and the external terminal pins of the M5Stack Atom J6 joint.

#### a) M5STACK Basic Electrical Diagram

| Pin | GPIO / Function | Pin | Function / GPIO |
|---|---|---|---|
| 1 | GND | 2 | ADC1 (GPIO35) |
| 3 | GND | 4 | ADC2 (GPIO36) |
| 5 | GND | 6 | RESET (EN) |
| 7 | MOSI (GPIO23) | 8 | DAC0/AUDIO_L (GPIO25) |
| 9 | MISO (GPIO19) | 10 | DAC1/AUDIO_R (GPIO26) |
| 11 | SCK (GPIO18) | 12 | 3.3V |
| 13 | IO0/RXD1 (GPIO3) | 14 | IO1/TXD1 (GPIO1) |
| 15 | IO2/RXD2 (GPIO16) | 16 | IO3/TXD2 (GPIO17) |
| 17 | IO4/SDA (GPIO21) | 18 | IO5/SCL (GPIO22) |
| 19 | IO6 (GPIO2) | 20 | IO7 (GPIO5) |
| 21 | IO8/IIS_SCLK (GPIO12) | 22 | IO9/IIS_WS (GPIO13) |
| 23 | IO10/IIS_OUT (GPIO15) | 24 | IO11/IIS_MCLK/BOOT (GPIO0) |
| 25 | HPWR | 26 | ADC0/IIS_IN (GPIO34) |
| 27 | HPWR | 28 | 5V |
| 29 | HPWR | 30 | BATTERY |

#### b) M5STACK Atom Circuit Diagram

*[Image: M5 ATOM Matrix circuit diagram showing the ESP32-PICO, 5x5 WS2812-2020 matrix, MPU-6886 IMU, GROVE, USB Type-C, DC-DC 5V to 3.3V and the connector pins G21, G22, G25, G19, G23, G33]*

#### c) IO Interface Diagram

*[Image: IO interface labels. Upper end M5: 5V, GND, 3V3, G22, G19, G23, G33 (up direction). Base M5: 5V, 3V3, G, 21, 22, 23, 19, 18 on one side and 5V, 3V3, G, SDA, SCL, MO, MI, SCK on the other; side pins RO/TO/R2/T2/G2/G5/DA/DA/AD/AD/RST/BAT/3V3/5V/G and 3/1/16/17/2/5/25/26/35/36/RST/BAT/3V3/5V; Button A, Button B, Button C]*

---

## 4. Software

For software updates, please check out our Github first.
<https://github.com/elephantrobotics/myCobot>

### 4.1 Firmware Upgrade and Recovery - myStudio

myStudio is a one-stop platform for robots of myRobot/myCobot.
The main functions of myStudio are:

1. Update the firmware;
2. Provide video tutorials on how to use the robot;
3. Provide maintenance and repair information (such as video tutorials, Q&A, etc.).

*[Image: myStudio start screen and main window]*

The link to YouTube videos about myStudio is: <https://youtu.be/Kr9i62ZPf4w>

If you need to upgrade or maintain your myCobot, make sure that the development environment is set up. If not, please install the serial port driver first and then try to use the software.

**The download link is as follows:**
Github: <https://github.com/elephantrobotics/MyStudio/>

If you use a Windows system, please choose "mystudio-windows.exe" to download, and then unzip it into your project folder. Be careful not to use it with complex paths, which may lead to problems with unrecognized paths.

If your development environment is already set up, you can directly open the file "myCobot.exe". After opening, the interface is as follows:

*[Image: myStudio connection window with USB Port (BASIC), Language (English) and Connect button; Version No. V 0.0.2]*

Connect your myCobot with "Basic" or "Atom", choose "language" and then click "Connect" to enter the main interface as shown below:

*[Image: myStudio main window with the sidebar Basic, Application, Software, Tools, Tutorials, Maintenance, Q&A, Handbooks, Github, Online Shop; apps MainControl and myCobotBLE; Board selector and Update button]*

If you connect both Basic and Atom, select the software you want to burn again in the Board bar in the upper right corner, and then click Basic or Tools to select the firmware you want to burn.

### 4.2 Built-in Track Recording

M5STACK Basic main control board has 3 buttons supporting custom programming and data writing. This program is open source, you can check our github.

*[Image: myCobot main screen with Button A, Button B and Button C]*

#### Drag Teaching Demonstration

**1. Recording:** After entering the recording mode, select the recording storage location.

*[Image: "Recording Mode" screen with the options Record Ram, Record Flash and Back]*

- Button A: Store to Ram
- Button B: Store to Memory Card
- Button C: Exit the Recording Mode

**2. Start Recording:** Click record and select the storage location, then manually drag the robotic arm to complete your target action and remember to save it, the action will be recorded and stored.

*[Image: "Record into Flash / Recording..." screen with "Stop Recording and Save"]*

> **Note:** The default recording time is 100s. If the recording time is too long that will exceed the memory, you can customize it by modifying the code, or record it on the computer.

**3. Play:** Click Button A to play the recorded action.

*[Image: "Infinite Playing Mode" screen with Play Ram, Play Flash and Back]*

- Button A: Start Playing the Recorded Action
- Button B: Pause
- Button C: Exit Playback

### 4.3 Arduino Libraries

A library is a collection of codes that allows you to easily connect and use sensors, displays, modules, etc. For example, the built-in LiquidCrystal library can realize easy communication with character LCD displays.

The functions of Arduino development board can be expanded when using the library. Because of the library, we can easily realize the collaboration between Arduino and external hardware or data communication. Arduino IDE is pre-installed with a series of standard library files. At the same time, you can also install and import third-party libraries (such as open source libraries downloaded from the Internet) into Arduino IDE. You can even create libraries and import them into Arduino IDE. The existence of the library helps users to bypass more specialized content such as registers and address pointers, greatly reducing the difficulty of development.

If you need to know how to add third-party libraries for the installation of ARDUINO IDE, please refer to the driver installation address and method:
<https://docs.m5stack.com/#/zh_CN/arduino/arduino_development>

*[Image: Arduino IDE download page (ARDUINO 1.8.12)]*

You can also check out our Github for more information.
<https://github.com/elephantrobotics/myCobot>

As follows:

*[Images: Arduino Library Manager searching "M5stack" and showing ESP32 Lite Pack Library, M5Atom, M5Core2, M5Stack and related libraries]*

### 4.4 API Interface and Communication

- UIFLOW
- Arduino
- microPython
- FreeRTOS

#### 4.4.1 UIFlow

Use UIFlow Beta Version and select Cooperation - myCobot.
<https://docs.m5stack.com/#/zh_CN/quick_start/m5core/m5stack_core_get_started_MicroPython>

*[Image: UIFlow Beta V1.7.0 with the Cooperation > myCobot block category highlighted]*

### 4.5 ROS

*[Image: RViz displaying the myCobot model with the joint_state_publisher sliders]*

#### Install ROS

Download address: <http://wiki.ros.org/ROS/Installation>
An example installation under Ubuntu 16.04 LTS is shown here.

```bash
# set source.list
sudo sh -c 'echo "deb http://packages.ros.org/ros/ubuntu $(lsb_release -sc) main" > /etc/apt/sources.list.d/ros-latest.list'

# add key
sudo apt-key adv --keyserver 'hkp://keyserver.ubuntu.com:80' --recv-key C1CF6E31E6BADE8868B172B4F42ED6FBAB17C654

# update software
sudo apt-get update

# install ros
sudo apt-get install ros-kinetic-desktop-full

# initial ros
sudo rosdep init
rosdep update

# set ros env
echo "source /opt/ros/kinetic/setup.bash" >> ~/.bashrc
source ~/.bashrc

# install ros dependency packages
sudo apt-get install python-rosinstall python-rosinstall-generator python-wstool build-essential
```

#### Test

```bash
# test whether install success
roscore
```

Prove that your ROS was successfully installed, as shown in the image below.

*[Image: terminal output of `roscore` and RViz showing the myCobot model]*

This is a ROS package about myCobot to help you better use myCobot in ROS.
Project address: <https://github.com/elephantrobotics/myCobotROS>

**Preparation before Use:**
Make sure the top Atom burns into Atom and the bottom BASIC burns into Transponder.

**Download Address of Burn Tool:**
<https://github.com/elephantrobotics/myCobot/tree/main/Software>

**Test environment for this package:**

- ubuntu: 16.04 LTS
- ros version: 1.12.17

If your version of Atom is 2.3 or earlier, or if pymycobot is 1.*, see the branch
<https://github.com/elephantrobotics/myCobotRos/tree/before>

#### 4.5.1 Installation

##### 4.5.1.1 Precondition

To use this package, make sure the Python API is installed correctly.

```bash
pip install pymycobot --user
```

##### 4.5.1.2 Download and Installation of ROS package

Install the ROS package into the src folder of Catkin.

```bash
$ cd ~/catkin_ws/src
$ git clone https://github.com/elephantrobotics/myCobotROS.git
$ cd ~/catkin_ws
$ catkin_make
```

##### 4.5.1.3 You can choose to test the Python API

```bash
cd ~/catkin_ws/src/myCobotROS
python3 scripts/test.py
```

#### 4.5.2 Module

##### 4.5.2.1 Node

- `display`: Display nodes. Synchronize the pose of myCobot to the simulation model.
- `control_slider`: myCobot is controlled through the slider.
- `control_marker`: myCobot is controlled through interactive tags.

##### 4.5.2.2 Topic

- `joint_states` - Control and record the states of myCobot

```
Message_type: std_msgs/JointState
Data: position[float, float, float, float, float, float]
```

#### 4.5.3 RViz

##### 4.5.3.1 Function

- `display.launch`: This function will display robot arm movement in realtime when you manually move myCobot.
- `control.launch`: This function will allow you use slider bar to control movement of the robot arm.

##### 4.5.3.2 Start and Operate

**Step 1:** Open roscore in terminal

```bash
roscore #open another tab
```

**Step 2:** Get started

a) If it is displaying or controlling with an interactive tag, run it in the second terminal:

```bash
roslaunch myCobotROS mycobot.launch
```

b) If it is a slider control, run it in the second terminal:

```bash
roslaunch myCobotROS control.launch
```

**Step 3:** Open rviz (third terminal)

```bash
rosrun rviz rviz
```

If you use the above command, you will open a blank rviz and need to add modules manually. Alternatively, you can also use the following command to open RVIZ and load a saved myCobot model.

```bash
rosrun rviz rviz -d `rospack find myCobotROS`/config/mycobot.rviz
```

**Step 4:** Run the Python script (fourth terminal)

A) Display the script

```bash
rosrun myCobotROS display.py
```

B) The slider control script

```bash
rosrun myCobotROS control_slider.py
```

C) Interactive tags control script

```bash
rosrun myCobotROS control_marker.py
```

### 4.6 Joint Calibration

If your myCobot needs to calibrate joints, please use the firmware of myCobot or Arduino and other tools to burn Calibration first.

After uploading the firmware, the Basic interface is shown below:

*[Image: Basic screen showing "Press A - Calibrate Servo 1~6", "Press B - Test Servos (long press to force testing)", "Press C - Restart Calibration"]*

At this time, rotate J1 to the standard zero position aligning with the groove, and press the A button (the left button), then the J1 will go from a dynamic motion into a static position and be fixed to this standard zero position.

Repeat the steps following this method to set up the remaining J2-J6. After J6 is set, press the A key (the left key) again to save all the settings.

When all joints are back to the standard zero position, you also need to check whether myCobot can operate normally. Press the B button (the middle button), then myCobot will detect J1 to J6 in sequence.

> **Warning:** Please ensure that there are no obstacles or personnel interference within the operating range in order to prevent damage to equipment and personnel during testing.

---

## 5. Visual Programming and Industrial Software

### 5.1 Visual Programming Software - UIFlow

For detailed usage, please get the UIFlow operation manual from the link below.

- **M5STACK Basic:** <https://docs.m5stack.com/#/zh_CN/quick_start/m5core/m5stack_core_get_started_MicroPython>
- **M5STACK Atom:** <https://docs.m5stack.com/#/zh_CN/quick_start/atom/atom_quick_start_uiflow>

### 5.2 Industrial Visualization Programming Software - RoboFlow

myCobot supports RoboFlow operating by Elephant Robotics industrial collaborative robots. The operation process of RoboFlow is simple and easy to use, and the interactive interface is clear and easy to understand, which is convenient for users to quickly master and use it, and effectively helps users to complete operations and programming tasks efficiently. Even novice users can also achieve target functions through simple operations.

**For detailed usage, please get the RoboFlow operation manual from the link below:**
<https://www.elephantrobotics.com/download/>

- **Download Website:** <https://github.com/elephantrobotics/myCobot/tree/main/Software>
- **RoboFlow Tutorial:** <https://www.elephantrobotics.com/tutorials/#>

---

## 6. After-sales Service

- Return service is limited to goods not opened within 7 days after the receipt date of logistics of the products. The freight or other risks incurred in return shall be borne by the customer.
- Customers should provide the purchasing invoice and warranty card as the warranty certification when a warranty is being asked.
- Elephant Robotics will be responsible for the hardware faults of products caused by the normal using during the warranty period.
- The warranty period starts from the date of purchase or the receipt date of the logistics.
- The faulty parts from the products will be owned by Elephant Robotics, and the appropriate cost will be charged if necessary.

If you need to apply for warranty service, please contact our customer service first to confirm the detailed information. The following is warranty terms of detailed components:

> **Note: If there is a conflict with the Product Brochure, the User Manual shall prevail.**

#### a) Servo motor

| Warranty Period | Warranty Services |
|---|---|
| ≤ 1 month | Elephant Robotics offers a free new servo motor and bear the freight. |
| 1–3 months | Elephant Robotics offers a free new servo motor, customers shall bear the freight. |
| ≥ 3 months | Customers need to buy it themselves. |

#### b) Electrical Parts (M5 Hardware)

| Warranty Period | Warranty Services |
|---|---|
| ≤ 3 months | Customers need to send it back after disassembly, Elephant Robotics shall send a new one for free and bear the freight out and home. |
| 3–6 months | Customers need to send it back after disassembly and bear the freight out and home, Elephant Robotics shall send a new one for free. |
| ≥ 6 months | Customers need to buy it themselves. |

#### c) Structure Parts, including Shell Parts

| Warranty Period | Warranty Services |
|---|---|
| ≤ 1 year | Elephant Robotics offers free new components once, customers shall bear the freight. |
| ≥ 1 year | Customers need to buy it themselves. |

During the warranty period of the delivered product, the company only repairs the malfunctions that occur during normal use of the robot for free. However, in the following cases, the customer will be charged for repairs (even during the warranty period):

- Damage or malfunction caused by incorrect use and improper use different from the manual.
- Failure caused by unauthorized disassembly by the customer.
- Damage caused by improper adjustment or unauthorized repairs.
- Damage caused by natural disasters such as earthquakes and floods.

Please strictly follow the instructions in this manual and related manual to operate the robot.

---

## 7. Q&A

Online Q&A sheet: <https://docs.qq.com/sheet/DYkZFRWZOU0hhaWdK?tab=w831xv>

**Q: The compiler could not find the corresponding device?**
A: The device can be developed only after setting up the development environment and installing the corresponding project library.

**Q: The compiler could not compile the sample program properly / find the corresponding device?**
A: The required project library is not installed or there is a conflict with the project library. Please check that the project library is installed correctly first. If it is installed correctly but still cannot compile, please reinstall Arduino development environment.

**Q: The device failed to function properly after burning the firmware to ATOM?**
A: The firmware for ATOM terminal needs to use our factory firmware. If any other firmware is accidentally burned, you can choose "myCobot固件烧录器 - 选择ATOM终端 - 选择串口 - 选择ATOMMAIN固件" (myCobot firmware burner → select ATOM terminal → select serial port → select ATOMMAIN firmware) to burn the ATOM terminal.

**Q: There is a slight wobble in the vertical position but not in the motion state?**
A: Please check if myCobot is in a vertical state. myCobot is not affected by gravity in a vertical state, mechanical voidage can cause minor wobbles. But there will not be wobbles when it's out of the vertical state. The recommended speed is 400-500 in a vertical state.

**Q: Will the ROS system charge later?**
A: ROS is open source and will be updated to our Github. There is no charge for firmware upgrades.

---

## 8. Contact Us

If you have any need for help, please contact us shown as following.

**Shenzhen Elephant Robotics Technology Co., Ltd**

- **Address:** B7, Yungu Innovative Industrial Park 2, Nanshan, Shenzhen, China
- **Email:** support@elephantrobotics.com
- **Phone:** +86 (0755)-8696-8565 (working day 9:30–18:30)
- **Website:** <https://www.elephantrobotics.com>
- **Shop:** <https://shop.elephantrobotics.com>
- **Twitter:** myCobot Official @CobotMy
- **Facebook:** <https://www.facebook.com/MyCobot-116558893805177>
- **YouTube:** <https://www.youtube.com/channel/UC68l2RaRF2Mp8fzpCTzNBfA>
