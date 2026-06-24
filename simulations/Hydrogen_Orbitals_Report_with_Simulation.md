# Hydrogen Atom, Orbitals, Boundary Conditions, and DFT

## 1. Introduction

This report explains, at a beginner level, how orbitals arise when solving the Schrodinger equation for a hydrogen atom, what the quantum numbers `l` and `m` mean, what boundary conditions are used, and whether Density Functional Theory (DFT) is suitable for simulating small molecules.

## 2. What is the Schrodinger Equation?

The Schrodinger equation is the main equation of quantum mechanics. It describes how electrons behave as waves. Solving the equation gives allowed energies and wave functions. The square of the wave function gives the probability of finding the electron.

$$
H\psi = E\psi
$$

For a hydrogen atom, we want to know:

> Where is the electron most likely to be found?

The Schrodinger equation helps us find this.

The solution is a **wave function** $\psi$.

The square of the wave function,

$$
|\psi|^2
$$

gives the probability of finding the electron.

## 3. Why Do Orbitals Have Different Shapes?

Electrons behave like standing waves around the nucleus. Just as a guitar string can vibrate only in certain patterns, electrons can exist only in certain wave patterns. These allowed wave patterns are called orbitals. Examples are `s` orbitals, which are spherical; `p` orbitals, which are dumbbell-shaped; and `d` orbitals, which are clover-shaped.

The electron is also a wave.

The Schrodinger equation finds the allowed standing-wave patterns around the nucleus.

These patterns are called **orbitals**.

## 4. Finite Difference Method and Eigenvectors

A computer replaces continuous space with a grid and converts the Hamiltonian into a matrix. Solving the matrix eigenvalue problem produces eigenvalues, which represent energies, and eigenvectors, which represent wave functions. The eigenvectors naturally resemble atomic orbitals because they are the allowed standing-wave patterns of the electron.

A computer cannot work with infinitely many points, so we replace space with a grid:

```text
o----o----o----o
|    |    |    |
o----o----o----o
|    |    |    |
o----o----o----o
```

The computer then builds a large matrix.

Instead of solving:

$$
H\psi = E\psi
$$

it solves a matrix equation:

$$
Ax = \lambda x
$$

where:

- $A$ = matrix version of the Hamiltonian
- $x$ = eigenvector
- $\lambda$ = energy

## 5. What Do `l` and `m` Mean?

The quantum number `l` determines the orbital shape: `l = 0` corresponds to `s` orbitals, `l = 1` to `p` orbitals, and `l = 2` to `d` orbitals. The quantum number `m` determines the orientation of the orbital in space. These quantum numbers arise because the hydrogen atom is symmetric in all directions.

`m` tells the orientation.

Suppose you have a dumbbell. You can point it:

```text
Along x:  ()--()

Along y:    ()
            |
            ()

Along z: perpendicular to the page or screen
```

These different directions correspond to different values of `m`.

For `l = 1`:

$$
m = -1, 0, +1
$$

## 6. Can We Solve for a Specific `l`?

Yes. By separating the radial and angular parts of the Schrodinger equation, it is possible to solve only for orbitals with a chosen value of `l`. This simplifies calculations and is commonly done in atomic physics.

## 7. Boundary Conditions for Hydrogen

Two important boundary conditions are used. At the nucleus, where `r = 0`, the wave function must remain finite. For the radial function, this means:

$$
u(0) = 0
$$

Far from the nucleus, the wave function must approach zero because the probability of finding the electron infinitely far away is negligible. In numerical calculations, a large maximum radius is chosen and the wave function is set to zero there.

## 8. What is DFT?

Density Functional Theory (DFT) is a computational method that calculates electron density instead of tracking every electron individually. This greatly reduces computational cost while maintaining good accuracy.

## 9. Is DFT Suitable for Small Molecules?

Yes. DFT is widely used for hydrogen (`H2`), oxygen (`O2`), water (`H2O`), and many other molecules. It can predict molecular structures, bond lengths, energies, electron densities, and vibrational frequencies. DFT offers a good balance between speed and accuracy.

## 10. Conclusion

Orbitals are allowed standing-wave patterns of electrons. The quantum numbers `l` and `m` describe orbital shape and orientation. Proper boundary conditions ensure physically meaningful solutions. DFT is an efficient and popular method for studying small molecules such as hydrogen, oxygen, and water.

# Example: 1D Schrodinger Equation with the Finite Difference Method

A very simple beginner example is to solve a **1D Schrodinger equation** using the finite difference method. It is not a hydrogen atom yet, but it shows exactly how a matrix produces eigenvectors that look like wave patterns, similar to orbitals.

## Schrodinger Equation

We start from:

$$
\widehat{H}\psi(x) = E\psi(x)
$$

where:

- $\widehat{H}$ = Hamiltonian operator
- $\psi$ = wave function
- $E$ = energy

## Hamiltonian

For a particle moving in a potential $V(x)$,

$$
\widehat{H} = -\frac{\hbar^2}{2m}\frac{d^2}{dx^2} + V(x)
$$

The two parts are:

$$
\widehat{H} = \widehat{T} + \widehat{V}
$$

where:

### Kinetic energy

$$
\widehat{T} = -\frac{\hbar^2}{2m}\frac{d^2}{dx^2}
$$

### Potential energy

$$
\widehat{V} = V(x)
$$

## Finite Difference Approximation

The second derivative becomes:

$$
\frac{d^2\psi}{dx^2} \approx \frac{\psi_{i+1} - 2\psi_i + \psi_{i-1}}{\Delta x^2}
$$

This turns the differential equation into a matrix equation.

## Create a Grid

Instead of infinitely many points, choose:

```text
x0   x1   x2   x3   x4
o----o----o----o----o
```

with spacing:

$$
\Delta x
$$

We want to know the wave function values:

$$
\psi_0, \psi_1, \psi_2, \psi_3, \psi_4
$$

at these points.

## Write it as a Matrix

For point $i = 2$:

$$
\frac{d^2\psi}{dx^2} \approx \frac{\psi_3 - 2\psi_2 + \psi_1}{\Delta x^2}
$$

Notice the coefficients:

$$
1, -2, +1
$$

These coefficients become one row of the matrix.

For all points:

$$
\frac{d^2}{dx^2} \approx \frac{1}{\Delta x^2}
\begin{bmatrix}
-2 & 1 & 0 & 0 \\
1 & -2 & 1 & 0 \\
0 & 1 & -2 & 1 \\
0 & 0 & 1 & -2
\end{bmatrix}
$$

This matrix is called the **finite-difference Laplacian**.

## Build the Kinetic-Energy Matrix

The kinetic operator is:

$$
T = -\frac{\hbar^2}{2m}\frac{d^2}{dx^2}
$$

Substitute the matrix approximation:

$$
T = -\frac{\hbar^2}{2m}\frac{1}{\Delta x^2}
\begin{bmatrix}
-2 & 1 & 0 & 0 \\
1 & -2 & 1 & 0 \\
0 & 1 & -2 & 1 \\
0 & 0 & 1 & -2
\end{bmatrix}
$$

Using atomic units:

$$
\hbar = 1
$$

and

$$
m = 1
$$

so

$$
\frac{\hbar^2}{2m} = \frac{1}{2}
$$

Therefore:

$$
T = -\frac{1}{2}\frac{1}{\Delta x^2}
\begin{bmatrix}
-2 & 1 & 0 & 0 \\
1 & -2 & 1 & 0 \\
0 & 1 & -2 & 1 \\
0 & 0 & 1 & -2
\end{bmatrix}
$$

## Build the Potential Matrix

Suppose:

$$
V(x_i) = V_i
$$

at each grid point.

The potential only multiplies the wave function:

$$
V(x)\psi(x)
$$

Therefore the matrix is diagonal:

$$
V =
\begin{bmatrix}
V_1 & 0 & 0 & 0 \\
0 & V_2 & 0 & 0 \\
0 & 0 & V_3 & 0 \\
0 & 0 & 0 & V_4
\end{bmatrix}
$$

Why diagonal?

Because the potential at point $x_i$ only affects $\psi_i$, not neighboring points.

## Add Them Together

The Hamiltonian is:

$$
H = T + V
$$

So:

$$
H = -\frac{1}{2}\frac{1}{\Delta x^2}
\begin{bmatrix}
-2 & 1 & 0 & 0 \\
1 & -2 & 1 & 0 \\
0 & 1 & -2 & 1 \\
0 & 0 & 1 & -2
\end{bmatrix}
+
\begin{bmatrix}
V_1 & 0 & 0 & 0 \\
0 & V_2 & 0 & 0 \\
0 & 0 & V_3 & 0 \\
0 & 0 & 0 & V_4
\end{bmatrix}
$$

This is the Hamiltonian matrix.

Using atomic units, the Hamiltonian matrix can also be written as:

$$
H = -\frac{1}{2}
\begin{bmatrix}
-2 & 1 & 0 & \cdots \\
1 & -2 & 1 & \cdots \\
0 & 1 & -2 & \cdots \\
\vdots & \vdots & \vdots & \ddots
\end{bmatrix}
\frac{1}{\Delta x^2}
+
\begin{bmatrix}
V_1 & 0 & 0 & \cdots \\
0 & V_2 & 0 & \cdots \\
0 & 0 & V_3 & \cdots \\
\vdots & \vdots & \vdots & \ddots
\end{bmatrix}
$$

# Simulation Python Code

```python
import numpy as np
import matplotlib.pyplot as plt

# --------------------------------------------------
# Schrödinger equation:
#
# H ψ = E ψ
#
# Hamiltonian:
#
# H = T + V
#
# T = -(1/2)d²/dx²
# V = potential energy
#
# Atomic units:
# ħ = 1
# m = 1
# --------------------------------------------------

N = 200

x_min = -5
x_max = 5

x = np.linspace(x_min, x_max, N)
dx = x[1] - x[0]

# --------------------------------------------------
# Potential:
#
# V(x) = 1/2 x²
#
# (Quantum harmonic oscillator)
# --------------------------------------------------

V = 0.5 * x**2

# --------------------------------------------------
# Finite difference approximation:
#
# d²ψ/dx² ≈
# (ψ[i+1] - 2ψ[i] + ψ[i-1]) / dx²
#
# Corresponding matrix:
#
# [ -2  1  0  0 ]
# [  1 -2  1  0 ]
# [  0  1 -2  1 ]
# [  0  0  1 -2 ]
# --------------------------------------------------

main_diag = -2 * np.ones(N)
off_diag = np.ones(N - 1)

laplacian = (
    np.diag(main_diag)
    + np.diag(off_diag, 1)
    + np.diag(off_diag, -1)
) / dx**2

# --------------------------------------------------
# Kinetic energy operator:
#
# T = -(1/2) ∇²
# --------------------------------------------------

T = -0.5 * laplacian

# --------------------------------------------------
# Potential energy operator:
#
# V = diag(V(x))
# --------------------------------------------------

V_matrix = np.diag(V)

# --------------------------------------------------
# Hamiltonian:
#
# H = T + V
# --------------------------------------------------

H = T + V_matrix

# --------------------------------------------------
# Solve:
#
# H ψ = E ψ
# --------------------------------------------------

energies, wavefunctions = np.linalg.eigh(H)

print("First five energies:")
for n in range(5):
    print(f"n={n}  E={energies[n]:.4f}")

# --------------------------------------------------
# Plot first four eigenvectors
# --------------------------------------------------

plt.figure(figsize=(8,6))

for n in range(4):

    psi = wavefunctions[:, n]

    psi = psi / np.max(np.abs(psi))

    plt.plot(
        x,
        psi + energies[n],
        label=f"State {n}"
    )

plt.plot(x, V, linewidth=2, label="V(x)")

plt.xlabel("x")
plt.ylabel("Energy")
plt.title("Hamiltonian Eigenvectors")
plt.legend()
plt.grid()

plt.show()
```
