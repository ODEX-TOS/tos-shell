# Maintainer: Tom Meyers (tom@odex.be)

pkgname=tos-shell
pkgver=1
pkgrel=1
pkgdesc="Helper shell extension to improve the gnome workflow"
arch=('any')
url="https://github.com/ODEX-TOS/tos-shell"
license=('MIT')
depends=('gnome-shell>=42' 'tos-base-desktop' 'tos-tools')
makedepends=('git')
provides=("${pkgname}")
conflicts=("${pkgname}")
source=("${pkgname}::git+${url}.git")
options=('!strip')
md5sums=('SKIP')

pkgver() {
  cd "${srcdir}/${pkgname%-git}"
  git describe --long --tags | sed 's/^v//;s/\([^-]*-g\)/r\1/;s/-/./g'
}


package() {
  cd "${srcdir}/${pkgname%}/"
  make system_install DESTDIR="${pkgdir}"
}
