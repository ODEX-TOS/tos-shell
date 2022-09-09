# Maintainer: Tom Meyers (tom@odex.be)

pkgname=tos-shell
pkgver=43
pkgrel=1
pkgdesc="Helper shell extension to improve the gnome workflow"
arch=('any')
url="https://github.com/ODEX-TOS/tos-shell"
license=('MIT')
depends=('gnome-shell>=42' 'tos-tools')
makedepends=('git')
provides=("${pkgname}")
conflicts=("${pkgname}")
source=("${pkgname}::git+${url}.git")
install="tos-shell.install"
options=('!strip')
md5sums=('SKIP')



package() {
  cd "${srcdir}/${pkgname%}/"
  make system_install DESTDIR="${pkgdir}"
}
